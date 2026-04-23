const axios = require("axios");

const USER_SERVICE_URL =
  process.env.USER_SERVICE_URL || "http://user-service:3000/api/users";

const getUserById = async (userId) => {
  try {
    const response = await axios.get(`${USER_SERVICE_URL}/${userId}`, {
      timeout: 10000,
    });
    return response.data;
  } catch (error) {
    throw new Error("User not found");
  }
};

module.exports = { getUserById };
