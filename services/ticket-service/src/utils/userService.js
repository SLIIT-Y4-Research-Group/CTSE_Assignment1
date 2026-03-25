const axios = require('axios');

const getUserById = async (userId) => {
  try {
    const response = await axios.get(`${process.env.GATEWAY_URL}/users/${userId}`);
    return response.data;
  } catch (error) {
    throw new Error('User not found');
  }
};

module.exports = { getUserById };