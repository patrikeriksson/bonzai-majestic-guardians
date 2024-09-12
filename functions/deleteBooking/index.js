const { sendResponse, sendError } = require("../../responses/index");
const { db } = require("../../services/db"); // Importera DynamoDB-klienten från den nyare SDK:n

// Lambda-funktionen för att ta bort en bokning
exports.handler = async (event) => {
  const bookingId = event.pathParameters.id; // Hämta boknings-ID från URL:en

  try {
    console.log(`Trying to delete booking with ID: ${bookingId}`);

    // Kontrollera om bokningen finns
    const booking = await db.get({
      TableName: "bookings",
      Key: { id: bookingId },
    });

    if (!booking.Item) {
      console.log(`Booking with ID ${bookingId} not found`);
      // Returnera ett felmeddelande om bokningen inte finns
      return sendError(404, `Booking with ID ${bookingId} not found`);
    }

    // Ta bort bokningen från DynamoDB
    await db.delete({
      TableName: "bookings",
      Key: { id: bookingId },
    });

    console.log(`Booking with ID ${bookingId} deleted successfully`);
    // Returnera ett lyckat svar
    return sendResponse({
      message: `Booking with ID ${bookingId} deleted successfully`,
    });
  } catch (error) {
    console.error("Error deleting booking:", error);
    // Returnera ett felmeddelande vid fel
    return sendError(500, "Could not delete booking");
  }
};
