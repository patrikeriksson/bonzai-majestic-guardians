const { sendResponse, sendError } = require("../../responses/index");
const { db } = require("../../services/db");
const { v4: uuidv4 } = require("uuid");
const { validateBooking } = require("../../services/validation");

// Kontrollera tillgång på rum och uppdatera tillgänglighet
async function checkAndUpdateRoomAvailability(roomType, numberOfGuests) {
  const roomId = `room#${roomType}`;
  const { Item: room } = await db.get({
    TableName: "rooms",
    Key: { id: roomId },
  });

  if (!room) throw new Error(`Room type ${roomType} not found`);

  const requiredRooms = Math.ceil(numberOfGuests / room.capacity);
  if (room.availableRooms < requiredRooms) return false;

  await db.update({
    TableName: "rooms",
    Key: { id: roomId },
    UpdateExpression: "set availableRooms = :newAvailableRooms",
    ExpressionAttributeValues: {
      ":newAvailableRooms": room.availableRooms - requiredRooms,
    },
  });
  return true;
}

// Skapa bokning
async function createBooking(
  bookingNumber,
  { numberOfGuests, roomType, visitDate, name, email }
) {
  await db.put({
    TableName: "bookings",
    Item: {
      id: bookingNumber,
      guests: numberOfGuests,
      roomType,
      checkIn: visitDate,
      checkOut: visitDate,
      name,
      email,
    },
  });
}

exports.handler = async (event) => {
  try {
    const bookingInfo = JSON.parse(event.body);
    const validationError = validateBooking(bookingInfo);
    if (validationError) return sendError(400, validationError);

    const isAvailable = await checkAndUpdateRoomAvailability(
      bookingInfo.roomType,
      bookingInfo.numberOfGuests
    );
    if (!isAvailable)
      return sendError(
        400,
        "No available rooms for the specified type and guests."
      );

    const bookingNumber = uuidv4();
    await createBooking(bookingNumber, bookingInfo);

    return sendResponse({
      message: "Booking created",
      bookingId: bookingNumber,
      bookingInfo: bookingInfo,
    });
  } catch (error) {
    console.error("Error creating booking:", error);
    return sendError(500, error.message || "Could not create booking");
  }
};

// Initiera rummen en gång
async function initializeRooms() {
  const roomsData = [
    { id: "room#single", capacity: 1, availableRooms: 4, price: 500 },
    { id: "room#double", capacity: 2, availableRooms: 10, price: 1000 },
    { id: "room#suite", capacity: 3, availableRooms: 6, price: 1500 },
  ];
  for (const room of roomsData)
    await db.put({ TableName: "rooms", Item: room });
}

initializeRooms(); // Anropa en gång för att initiera rummen
