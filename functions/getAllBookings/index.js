const { sendResponse, sendError } = require("../../responses/index");
const { db } = require("../../services/db");

exports.handler = async () => {
  try {
    // Hämtar alla bokningar från DynamoDB
    const { Items: bookings } = await db.scan({ TableName: "bookings" });

    // Skapar en variabel med enbart de fält som receptionisten önskar se
    const bookingsData = bookings.map((booking) => ({
      bookingNumber: booking.id,
      checkInDate: booking.checkIn,
      checkOutDate: booking.checkOut,
      numberOfGuests: booking.guests,
      // Räknar antalet rumstyper
      singleRoom: (booking.rooms || [])
        .filter((room) => room.type === "singleRoom")
        .reduce((acc, room) => acc + room.requested, 0),
      doubleRoom: (booking.rooms || [])
        .filter((room) => room.type === "doubleRoom")
        .reduce((acc, room) => acc + room.requested, 0),
      suite: (booking.rooms || [])
        .filter((room) => room.type === "suite")
        .reduce((acc, room) => acc + room.requested, 0),
      fullName: booking.name,
    }));

    return sendResponse({ bookings: bookingsData });
  } catch (error) {
    return sendError(500, { message: "Unable to retrieve bookings" });
  }
};
