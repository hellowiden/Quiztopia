// Path: auth/register.js

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, GetCommand, PutCommand } = require("@aws-sdk/lib-dynamodb");
const bcrypt = require("bcryptjs");

const client = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(client);

const USERS_TABLE = process.env.USERS_TABLE;

module.exports.handler = async (event) => {
  const { userId, name, password } = JSON.parse(event.body);

  if (!userId || !name || !password) {
    return { statusCode: 400, body: JSON.stringify({ error: "userId, name, and password are required" }) };
  }

  const getParams = {
    TableName: USERS_TABLE,
    Key: { userId },
  };

  try {
    const getUserCommand = new GetCommand(getParams);
    const { Item } = await docClient.send(getUserCommand);

    if (Item) {
      return { statusCode: 400, body: JSON.stringify({ error: "User already exists" }) };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const putParams = {
      TableName: USERS_TABLE,
      Item: { userId, name, password: hashedPassword },
    };

    const putCommand = new PutCommand(putParams);
    await docClient.send(putCommand);

    return { statusCode: 201, body: JSON.stringify({ message: "User registered successfully", userId }) };
  } catch (error) {
    console.error("Error registering user:", error);
    return { statusCode: 500, body: JSON.stringify({ error: `Could not register user: ${error.message}` }) };
  }
};

