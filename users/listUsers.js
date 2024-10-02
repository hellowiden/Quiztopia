// Path: users/listUsers.js

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, ScanCommand } = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(client);

const USERS_TABLE = process.env.USERS_TABLE;

module.exports.handler = async () => {
  const params = {
    TableName: USERS_TABLE,
  };

  try {
    const command = new ScanCommand(params);
    const { Items: users } = await docClient.send(command);

    return { statusCode: 200, body: JSON.stringify({ users }) };
  } catch (error) {
    console.error("Error retrieving users:", error);
    return { statusCode: 500, body: JSON.stringify({ error: `Could not retrieve users: ${error.message}` }) };
  }
};
