const roomCapacity = {
  single: 1,
  double: 2,
  suite: 3,
};

// Funktion för att validera bokningsdata
function validateBooking(bookingInfo) {
  const { numberOfGuests, roomType } = bookingInfo;

  // Kontrollera att rumtypen är giltig
  if (!roomCapacity[roomType]) {
    return "Invalid room type";
  }

  // Kontrollera att antalet gäster matchar rumskapaciteten
  if (parseInt(numberOfGuests, 10) !== roomCapacity[roomType]) {
    return `Room type ${roomType} can only accommodate ${roomCapacity[roomType]} guest(s)`;
  }

  return null;
}

module.exports = { validateBooking };
