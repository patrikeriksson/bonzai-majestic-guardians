const { sendResponse, sendError } = require("../../responses/index");
const { db } = require("../../services/db");
const { v4: uuidv4 } = require("uuid");

async function createBooking(bookingNumber, bookingInfo) {
  await db.put({
    TableName: "bookings",
    Item: {
      guests: guests,
      roomType: roomType,
      checkIn: checkIn,
      checkOut: checkOut,
      name: name,
      email: email,
      bookingId: bookingNumber,
    },
  });
}

exports.handler = async (event) => {
  const bookingInfo = JSON.parse(event.body);
  console.log(bookingInfo);

  const bookingNumber = uuidv4();

  await createBooking(bookingNumber, bookingInfo);

  return sendResponse({ message: "Booking created", bookingInfo });
};
