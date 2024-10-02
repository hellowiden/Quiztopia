// Path: auth/login.js

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, GetCommand } = require("@aws-sdk/lib-dynamodb");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const client = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(client);

const USERS_TABLE = process.env.USERS_TABLE;
const JWT_SECRET = process.env.JWT_SECRET;

module.exports.handler = async (event) => {
  const { userId, password } = JSON.parse(event.body);

  if (!userId || !password) {
    return { statusCode: 400, body: JSON.stringify({ error: "userId and password are required" }) };
  }

  const params = {
    TableName: USERS_TABLE,
    Key: { userId },
  };

  try {
    const command = new GetCommand(params);
    const { Item } = await docClient.send(command);

    if (!Item) {
      return { statusCode: 401, body: JSON.stringify({ error: "Invalid credentials" }) };
    }

    const isMatch = await bcrypt.compare(password, Item.password);
    if (!isMatch) {
      return { statusCode: 401, body: JSON.stringify({ error: "Invalid credentials" }) };
    }

    const token = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "1h" });
    return { statusCode: 200, body: JSON.stringify({ message: "User logged in", token }) };
  } catch (error) {
    console.error("Error logging in user:", error);
    return { statusCode: 500, body: JSON.stringify({ error: `Could not log in user: ${error.message}` }) };
  }
};
