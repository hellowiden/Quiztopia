// Path: quizzes/deleteQuiz.js

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, DeleteCommand, GetCommand } = require("@aws-sdk/lib-dynamodb");
const jwt = require("jsonwebtoken");

const client = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(client);

const QUIZZES_TABLE = process.env.QUIZZES_TABLE;
const JWT_SECRET = process.env.JWT_SECRET;

module.exports.handler = async (event) => {
  const token = event.headers.Authorization?.split(' ')[1];
  const { quizId } = event.pathParameters;

  if (!token || !quizId) {
    return { statusCode: 400, body: JSON.stringify({ error: "Missing fields or token" }) };
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    const getParams = {
      TableName: QUIZZES_TABLE,
      Key: { quizId },
    };

    const getCommand = new GetCommand(getParams);
    const { Item } = await docClient.send(getCommand);

    if (!Item || Item.creator !== decoded.userId) {
      return { statusCode: 403, body: JSON.stringify({ error: "You are not authorized to delete this quiz" }) };
    }

    const deleteParams = {
      TableName: QUIZZES_TABLE,
      Key: { quizId },
    };

    const deleteCommand = new DeleteCommand(deleteParams);
    await docClient.send(deleteCommand);

    return { statusCode: 200, body: JSON.stringify({ message: "Quiz deleted" }) };
  } catch (error) {
    console.error("Error deleting quiz:", error);
    return { statusCode: 500, body: JSON.stringify({ error: `Could not delete quiz: ${error.message}` }) };
  }
};
