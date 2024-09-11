const { sendResponse, sendError } = require("../../responses/index");
const { db } = require("../../services/db");

exports.handler = async () => {
  try {
    // Hämtar alla bokningar från DynamoDB
    const { Items: bookings } = await db.scan({ TableName: "bookings" });

    // Skapar en variabel med enbart de fält som som receptionisten önskar se
    const bookingsData = bookings.map((booking) => ({
      bookingNumber: booking.id,
      checkInDate: booking.checkIn,
      checkOutDate: booking.checkOut,
      numberOfGuests: booking.guests,
      // Räknar antalet rumstyper
      singleRoom: (booking.roomTypes || []).filter(
        (type) => type === "singleRoom"
      ).length,
      doubleRoom: (booking.roomTypes || []).filter(
        (type) => type === "doubleRoom"
      ).length,
      suite: (booking.roomTypes || []).filter((type) => type === "suite")
        .length,
      fullName: booking.name,
    }));

    return sendResponse({ bookings: bookingsData });
  } catch (error) {
    return sendError(500, { message: "Unable to retrieve bookings" });
  }
};
