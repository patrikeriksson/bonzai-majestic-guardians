const { sendResponse, sendError } = require("../../responses/index");
const { db } = require("../../services/db");
const { v4: uuidv4 } = require("uuid");
const { validateBooking } = require("../../services/validation");

// Kontrollera och uppdatera rumstillgång
async function checkAndUpdateRoomAvailability(selectedRooms, numberOfGuests) {
  let totalCapacity = 0; // Håller reda på den totala tillgängliga kapaciteten

  // Iterera över de valda rummen
  for (const room of selectedRooms) {
    const roomId = `room#${room.type}`; // Skapa rum-ID baserat på rumstyp
    // Hämta rumdata från databasen
    const { Item: roomData } = await db.get({
      TableName: "rooms",
      Key: { id: roomId },
    });

    // Om rumdata inte finns
    if (!roomData) throw new Error(`Room type ${room.type} not found`);
    // Kontrollera om det finns tillräckligt med tillgängliga rum
    if (roomData.availableRooms < room.requested) return false;

    // Lägg till kapaciteten för de begärda rummen
    totalCapacity += roomData.capacity * room.requested;
  }

  // Kontrollera att den totala kapaciteten är tillräcklig för antalet gäster
  if (totalCapacity < numberOfGuests) return false;

  // Uppdatera tillgängliga rum i databasen
  for (const room of selectedRooms) {
    const roomId = `room#${room.type}`;
    // Hämta rumdata igen
    const { Item: roomData } = await db.get({
      TableName: "rooms",
      Key: { id: roomId },
    });

    // Uppdatera tillgängliga rum i databasen
    await db.update({
      TableName: "rooms",
      Key: { id: roomId },
      UpdateExpression: "set availableRooms = :newAvailableRooms",
      ExpressionAttributeValues: {
        ":newAvailableRooms": roomData.availableRooms - room.requested,
      },
    });
  }

  return true; // Returnera true om rumstillgången är tillräcklig
}

// Funktion för att skapa en bokning
async function createBooking(bookingNumber, bookingInfo, totalAmount) {
  // Spara bokningsinformation i databasen
  await db.put({
    TableName: "bookings",
    Item: {
      id: bookingNumber,
      guests: bookingInfo.numberOfGuests,
      rooms: bookingInfo.selectedRooms,
      checkIn: bookingInfo.checkInDate,
      checkOut: bookingInfo.checkOutDate,
      name: bookingInfo.fullName,
      email: bookingInfo.email,
      totalAmount: totalAmount,
    },
  });
}

// Lambda-funktionen
exports.handler = async (event) => {
  try {
    const bookingInfo = JSON.parse(event.body);
    // Validera bokningsinformation
    const validationError = validateBooking(bookingInfo);
    // Returnera fel om validering misslyckas
    if (validationError) return sendError(400, validationError);

    // Förbereda en lista med valda rum
    const selectedRooms = [
      { type: "singleRoom", requested: bookingInfo.singleRoom || 0 },
      { type: "doubleRoom", requested: bookingInfo.doubleRoom || 0 },
      { type: "suite", requested: bookingInfo.suite || 0 },
    ];

    // Kontrollera och uppdatera rumstillgång
    const isAvailable = await checkAndUpdateRoomAvailability(
      selectedRooms,
      bookingInfo.numberOfGuests
    );
    // Returnera fel om rum inte är tillgängliga
    if (!isAvailable)
      return sendError(
        400,
        "No available rooms for the specified type and guests."
      );

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

    const bookingNumber = uuidv4(); // Generera ett unikt bokningsnummer
    await createBooking(bookingNumber, bookingInfo, totalAmount); // Skapa bokningen i databasen

    // Returnera ett svar med bokningsinformation
    return sendResponse({
      message: "Booking created",
      bookingId: bookingNumber,
      bookingInfo: { ...bookingInfo, totalAmount },
    });
  } catch (error) {
    // Hantera eventuella fel
    return sendError(500, error.message || "Could not create booking");
  }
};

// Funktion för att initiera rummen i databasen
async function initializeRooms() {
  const roomsData = [
    { id: "room#singleRoom", capacity: 1, availableRooms: 4, price: 500 },
    { id: "room#doubleRoom", capacity: 2, availableRooms: 10, price: 1000 },
    { id: "room#suite", capacity: 3, availableRooms: 6, price: 1500 },
  ];
  // Lägg till varje rum i databasen
  for (const room of roomsData)
    await db.put({ TableName: "rooms", Item: room });
}

// Anropa initializeRooms en gång för att lägga till rum i databasen
initializeRooms();
