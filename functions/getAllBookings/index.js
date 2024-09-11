const { db } = require("../../services/db");

exports.handler = async (event) => {
  try {
    const result = await db.scan({ TableName: "bookings" }).promise();
    
    return {
      statusCode: 200,
      body: JSON.stringify(result.Items),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Error fetching bookings" }),
    };
  }
};