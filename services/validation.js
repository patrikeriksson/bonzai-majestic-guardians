const roomCapacity = {
  singleRoom: 1,
  doubleRoom: 2,
  suite: 3,
};

// Funktion för att validera bokningsdata
function validateBooking(bookingInfo) {
  const { singleRoom, doubleRoom, suite, numberOfGuests } = bookingInfo;

  // Kontrollera att rumstyperna är giltiga
  const roomTypes = [singleRoom, doubleRoom, suite];
  for (const [type, count] of Object.entries(roomCapacity)) {
    if (bookingInfo[type] < 0) {
      return `Invalid number of ${type} rooms requested`;
    }
  }

  // Kontrollera att det totala antalet gäster matchar rumsbehovet
  const totalCapacity =
    singleRoom * roomCapacity.singleRoom +
    doubleRoom * roomCapacity.doubleRoom +
    suite * roomCapacity.suite;
  if (numberOfGuests > totalCapacity) {
    return `Number of guests exceeds the total capacity of selected rooms`;
  }

  return null;
}

module.exports = { validateBooking };
