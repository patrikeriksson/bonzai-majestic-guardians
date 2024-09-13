const roomCapacity = {
  singleRoom: 1,
  doubleRoom: 2,
  suite: 3,
};

// Funktion för att validera bokningsdata
function validateBooking(bookingInfo) {
  const {
    singleRoom,
    doubleRoom,
    suite,
    numberOfGuests,
    checkInDate,
    checkOutDate,
  } = bookingInfo;

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

  // Datumvalidering

  // Validera datumformat, yyyy-mm-dd
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  if (!datePattern.test(checkInDate) || !datePattern.test(checkOutDate)) {
    return "Invalid date format. Please use yyyy-mm-dd.";
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0); // Sätt dagens datum utan tid (endast datumdelen)

  const checkIn = new Date(checkInDate);
  const checkOut = new Date(checkOutDate);

  // Kontrollera att datumen är giltiga
  if (isNaN(checkIn) || isNaN(checkOut)) {
    return "Invalid check-in or check-out date.";
  }

  // Kontrollera att incheckningsdatumet inte är tidigare än dagens datum
  if (checkIn < today) {
    return "Check-in date cannot be in the past.";
  }

  // Kontrollera att utcheckningsdatumet inte är tidigare än incheckningsdatumet
  if (checkOut <= checkIn) {
    return "Check-out date must be after the check-in date.";
  }

  return null;
}

module.exports = { validateBooking };
