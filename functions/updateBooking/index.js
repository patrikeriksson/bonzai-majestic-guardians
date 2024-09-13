const { sendResponse, sendError } = require("../../responses/index");
const { db } = require("../../services/db");
const { validateBooking } = require("../../services/validation");

// Funkction för att uppdatera tillgången på rum i databasen
async function updateRoomAvailability(quantity, mode) {
  const roomId = "totalRooms";

  // Hämta aktuell information om rum från databasen
  const { Item: roomData } = await db.get({
    TableName: "rooms",
    Key: { id: roomId },
  });

  if (!roomData) {
    throw new Error("Room data not found");
  }

  // Sätt variabeln för uppdaterat antal tillgängliga rum till den nuvarande värdet
  let updatedAvailableRooms = roomData.availableRooms;

  // Justera antalet rum (lägg till eller ta bort rum)
  if (mode === "addRooms") {
    updatedAvailableRooms += quantity;
  } else if (mode === "removeRooms") {
    updatedAvailableRooms -= quantity;
  } else {
    throw new Error("Invalid mode specified");
  }

  // Kontrollera att det uppdaterade antalet tillgängliga rum inte blir negativt
  if (updatedAvailableRooms < 0) {
    throw new Error("Not enough rooms available");
  }

  // Uppdatera antalet tillgängliga rum i databasen
  await db.update({
    TableName: "rooms",
    Key: { id: roomId },
    UpdateExpression: "set availableRooms = :newAvailableRooms",
    ExpressionAttributeValues: {
      ":newAvailableRooms": updatedAvailableRooms,
    },
  });
}

// Funktion för att uppdatera bokning
async function updateBooking(bookingId, updatedBookingInfo) {
  // Hämta befintlig bokning
  const { Item: existingBooking } = await db.get({
    TableName: "bookings",
    Key: { id: bookingId },
  });

  if (!existingBooking) {
    throw new Error("Booking not found");
  }

  // Kontrollera om de skyddade fälten har ändrats
  if (existingBooking.id !== bookingId) {
    return sendError(400, "Booking ID cannot be changed.");
  }
  if (existingBooking.name !== updatedBookingInfo.fullName) {
    return sendError(400, "Full name cannot be changed.");
  }
  if (existingBooking.email !== updatedBookingInfo.email) {
    return sendError(400, "Email cannot be changed.");
  }

  // Validera uppdaterad bokningsinformation
  const validationError = validateBooking(updatedBookingInfo);
  if (validationError) return sendError(400, validationError);

  // Beräkna totalt antal rum som efterfrågas i den nya bokningen
  const newRoomsRequested =
    (updatedBookingInfo.singleRoom || 0) +
    (updatedBookingInfo.doubleRoom || 0) +
    (updatedBookingInfo.suite || 0);

  // Beräkna hur många rum som var bokade tidigare
  const previousRoomsBooked =
    (existingBooking.rooms
      .filter((r) => r.type === "singleRoom")
      .reduce((acc, r) => acc + r.requested, 0) || 0) +
    (existingBooking.rooms
      .filter((r) => r.type === "doubleRoom")
      .reduce((acc, r) => acc + r.requested, 0) || 0) +
    (existingBooking.rooms
      .filter((r) => r.type === "suite")
      .reduce((acc, r) => acc + r.requested, 0) || 0);

  // Återställ tidigare bokade rum till tillgängliga rum
  if (previousRoomsBooked > 0) {
    await updateRoomAvailability(previousRoomsBooked, "addRooms");
  }

  // Om du nu begär ett annat antal rum, minska det tillgängliga antalet
  if (newRoomsRequested > 0) {
    await updateRoomAvailability(newRoomsRequested, "removeRooms");
  }

  // Beräkna nya totala beloppet baserat på uppdaterad information
  const numberOfNights = Math.ceil(
    (new Date(updatedBookingInfo.checkOutDate) -
      new Date(updatedBookingInfo.checkInDate)) /
      (1000 * 60 * 60 * 24)
  );

  const pricePerNight = { singleRoom: 500, doubleRoom: 1000, suite: 1500 };
  const newTotalAmount =
    (updatedBookingInfo.singleRoom || 0) *
      pricePerNight.singleRoom *
      numberOfNights +
    (updatedBookingInfo.doubleRoom || 0) *
      pricePerNight.doubleRoom *
      numberOfNights +
    (updatedBookingInfo.suite || 0) * pricePerNight.suite * numberOfNights;

  // Skapa en ny array för rumstyper baserat på uppdaterad bokningsinformation
  const selectedRooms = [];

  if (updatedBookingInfo.singleRoom > 0) {
    selectedRooms.push({
      type: "singleRoom",
      requested: updatedBookingInfo.singleRoom,
    });
  }
  if (updatedBookingInfo.doubleRoom > 0) {
    selectedRooms.push({
      type: "doubleRoom",
      requested: updatedBookingInfo.doubleRoom,
    });
  }
  if (updatedBookingInfo.suite > 0) {
    selectedRooms.push({
      type: "suite",
      requested: updatedBookingInfo.suite,
    });
  }

  // Uppdatera bokningsinformation i databasen
  await db.update({
    TableName: "bookings",
    Key: { id: bookingId },
    UpdateExpression:
      "set checkIn = :newCheckIn, checkOut = :newCheckOut, guests = :newGuests, rooms = :newRooms",
    ExpressionAttributeValues: {
      ":newCheckIn": updatedBookingInfo.checkInDate,
      ":newCheckOut": updatedBookingInfo.checkOutDate,
      ":newGuests": updatedBookingInfo.numberOfGuests,
      ":newRooms": selectedRooms,
    },
  });

  // Returnera ett svar med uppdaterad bokningsinformation
  return sendResponse({
    message: "Booking updated",
    bookingId: bookingId,
    updatedBookingInfo: { ...updatedBookingInfo, totalAmount: newTotalAmount },
  });
}

exports.handler = async (event) => {
  try {
    const bookingId = event.pathParameters.id;
    const updatedBookingInfo = JSON.parse(event.body);

    // Uppdatera bokningen med nya värden
    return await updateBooking(bookingId, updatedBookingInfo);
  } catch (error) {
    return sendError(500, error.message || "Could not update booking");
  }
};
