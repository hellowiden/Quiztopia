// Path: quizzes/createQuiz.js

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb");
const jwt = require("jsonwebtoken");

const client = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(client);

const QUIZZES_TABLE = process.env.QUIZZES_TABLE;
const JWT_SECRET = process.env.JWT_SECRET;

module.exports.handler = async (event) => {
  const token = event.headers.Authorization?.split(' ')[1];
  const { quizId, name } = JSON.parse(event.body);

  if (!token || !quizId || !name) {
    return { statusCode: 400, body: JSON.stringify({ error: "Missing fields or token" }) };
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    const params = {
      TableName: QUIZZES_TABLE,
      Item: { quizId, name, creator: decoded.userId },
    };

    const command = new PutCommand(params);
    await docClient.send(command);

    return { statusCode: 201, body: JSON.stringify({ message: "Quiz created", quizId }) };
  } catch (error) {
    console.error("Error creating quiz:", error);
    return { statusCode: 500, body: JSON.stringify({ error: `Could not create quiz: ${error.message}` }) };
  }
};
