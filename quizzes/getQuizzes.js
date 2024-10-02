// Path: quizzes/getQuiz.js

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, ScanCommand } = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(client);

const QUIZZES_TABLE = process.env.QUIZZES_TABLE;

module.exports.handler = async () => {
  const params = {
    TableName: QUIZZES_TABLE,
  };

  try {
    const command = new ScanCommand(params);
    const { Items: quizzes } = await docClient.send(command);

    return { statusCode: 200, body: JSON.stringify({ quizzes }) };
  } catch (error) {
    console.error("Error retrieving quizzes:", error);
    return { statusCode: 500, body: JSON.stringify({ error: `Could not retrieve quizzes: ${error.message}` }) };
  }
};
