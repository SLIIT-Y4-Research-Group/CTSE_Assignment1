const generateBookingReference = () => {
  return 'BK' + Math.floor(100000 + Math.random() * 900000);
};

module.exports = { generateBookingReference };