const { sendResponse, sendError } = require("../../responses/index");
const { db } = require("../../services/db");
const { v4: uuidv4 } = require("uuid");
const { validateBooking } = require("../../services/validation");

// Funktion för att uppdatera rumsdatan oavsett rumstyp
async function updateRoomAvailability(numberOfRooms) {
  const roomId = "totalRooms"; // Ett ID som representerar totalt antal rum
  const { Item: roomData } = await db.get({
    TableName: "rooms",
    Key: { id: roomId },
  });

  if (!roomData) {
    throw new Error("Room data not found");
  }

  // Kontrollera om tillräckligt många rum finns
  if (roomData.availableRooms < numberOfRooms) {
    throw new Error("Not enough rooms available");
  }

  // Uppdatera antal tillgängliga rum
  await db.update({
    TableName: "rooms",
    Key: { id: roomId },
    UpdateExpression: "set availableRooms = :newAvailableRooms",
    ExpressionAttributeValues: {
      ":newAvailableRooms": roomData.availableRooms - numberOfRooms,
    },
  });
}

// Funktion för att skapa en bokning
async function createBooking(bookingNumber, bookingInfo, totalAmount) {
  // Skapa en array med rumstyper baserat på bokningsinformationen
  const roomTypes = [];
  const selectedRooms = []; // Array för ruminformation

  if (bookingInfo.singleRoom > 0) {
    roomTypes.push("singleRoom");
    selectedRooms.push({
      type: "singleRoom",
      requested: bookingInfo.singleRoom,
    });
  }
  if (bookingInfo.doubleRoom > 0) {
    roomTypes.push("doubleRoom");
    selectedRooms.push({
      type: "doubleRoom",
      requested: bookingInfo.doubleRoom,
    });
  }
  if (bookingInfo.suite > 0) {
    roomTypes.push("suite");
    selectedRooms.push({ type: "suite", requested: bookingInfo.suite });
  }

  // Spara bokningsinformation i databasen
  await db.put({
    TableName: "bookings",
    Item: {
      id: bookingNumber,
      guests: bookingInfo.numberOfGuests,
      rooms: selectedRooms,
      checkIn: bookingInfo.checkInDate,
      checkOut: bookingInfo.checkOutDate,
      name: bookingInfo.fullName,
      email: bookingInfo.email,
      totalAmount: totalAmount,
      roomTypes: roomTypes,
    },
  });
}

exports.handler = async (event) => {
  try {
    const bookingInfo = JSON.parse(event.body);

    // Validera bokningsinformation
    const validationError = validateBooking(bookingInfo);
    if (validationError) return sendError(400, validationError);

    // Förbereda en lista med valda rum
    const selectedRooms = [
      { type: "singleRoom", requested: bookingInfo.singleRoom || 0 },
      { type: "doubleRoom", requested: bookingInfo.doubleRoom || 0 },
      { type: "suite", requested: bookingInfo.suite || 0 },
    ];

    // Beräkna totalt antal rum som bokas
    const totalRoomsRequested =
      bookingInfo.singleRoom + bookingInfo.doubleRoom + bookingInfo.suite;

    // Uppdatera rumsdatan dynamiskt baserat på totalt antal bokade rum
    await updateRoomAvailability(totalRoomsRequested);

    // Beräkna antal nätter mellan inchecknings- och utcheckningsdatum
    const numberOfNights = Math.ceil(
      (new Date(bookingInfo.checkOutDate) - new Date(bookingInfo.checkInDate)) /
        (1000 * 60 * 60 * 24)
    );

    // Definiera priser per natt för varje rumstyp
    const pricePerNight = { singleRoom: 500, doubleRoom: 1000, suite: 1500 };
    // Beräkna det totala beloppet för bokningen
    const totalAmount = selectedRooms.reduce(
      (acc, room) =>
        acc + (pricePerNight[room.type] || 0) * room.requested * numberOfNights,
      0
    );

    // Generera ett unikt bokningsnummer
    const bookingNumber = uuidv4();

    // Skapa bokningen i databasen
    await createBooking(bookingNumber, bookingInfo, totalAmount);

    // Returnera ett svar med bokningsinformation
    return sendResponse({
      message: "Booking created",
      bookingId: bookingNumber,
      bookingInfo: { ...bookingInfo, totalAmount },
    });
  } catch (error) {
    return sendError(500, "Could not create booking");
  }
};

// Funktion för att initiera och lägga till rummen i databasen
async function initializeRooms() {
  const roomsData = [{ id: "totalRooms", availableRooms: 20, capacity: 20 }];
  for (const room of roomsData)
    await db.put({ TableName: "rooms", Item: room });
}

initializeRooms();
