const { sendResponse, sendError } = require("../../responses/index");
const { db } = require("../../services/db");

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

  // Uppdatera antal tillgängliga rum
  await db.update({
    TableName: "rooms",
    Key: { id: roomId },
    UpdateExpression: "set availableRooms = :newAvailableRooms",
    ExpressionAttributeValues: {
      ":newAvailableRooms": roomData.availableRooms + numberOfRooms,
    },
    ReturnValues: "ALL_NEW", // Returnera det nya värdet efter uppdateringen
  });
}

exports.handler = async (event) => {
  const bookingId = event.pathParameters.id;

  try {
    // Hämtar bokningsinformationen från DynamoDB-tabellen
    const booking = await db.get({
      TableName: "bookings",
      Key: { id: bookingId },
    });

    if (!booking.Item) {
      return sendError(404, `Booking with ID ${bookingId} not found`);
    }

    // Säkerställ att rooms är en array
    const rooms = booking.Item.rooms;
    if (!rooms || !Array.isArray(rooms)) {
      throw new Error("Booking rooms data is not an array or is missing");
    }

    // Extrahera antalet rum som ska läggas till tillgängligheten igen
    const numberOfRooms = rooms.reduce(
      (sum, room) => sum + (room.requested || 0),
      0
    );

    // Ta bort bokningen från DynamoDB
    await db.delete({
      TableName: "bookings",
      Key: { id: bookingId },
    });

    // Uppdatera tillgängliga rum
    await updateRoomAvailability(numberOfRooms);
    // Returnera ett lyckat svar
    return sendResponse({
      message: `Booking with ID ${bookingId} deleted successfully`,
    });
  } catch (error) {
    // Returnera ett felmeddelande vid fel
    return sendError(500, "Could not delete booking");
  }
};
