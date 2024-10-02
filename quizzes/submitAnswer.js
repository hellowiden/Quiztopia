// Path quizzes/submitAnswer.js

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, GetCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");
const jwt = require("jsonwebtoken");

const client = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(client);

const QUESTIONS_TABLE = process.env.QUESTIONS_TABLE;
const SCORES_TABLE = process.env.SCORES_TABLE;
const JWT_SECRET = process.env.JWT_SECRET;

module.exports.handler = async (event) => {
  // Extract token from the Authorization header
  const token = event.headers.Authorization?.split(' ')[1];
  const { quizId, questionId } = event.pathParameters;
  const { answer } = JSON.parse(event.body);

  // Ensure all necessary fields are present
  if (!token || !quizId || !questionId || !answer) {
    return { statusCode: 400, body: JSON.stringify({ error: "Missing fields or token" }) };
  }

  try {
    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId;

    // Fetch the correct answer for the question
    const getQuestionParams = {
      TableName: QUESTIONS_TABLE,
      Key: { questionId, quizId },
    };
    const getQuestionCommand = new GetCommand(getQuestionParams);
    const { Item: question } = await docClient.send(getQuestionCommand);

    // If the question is not found, return a 404 error
    if (!question) {
      return { statusCode: 404, body: JSON.stringify({ error: "Question not found" }) };
    }

    const isCorrect = question.correctAnswer === answer;

    const getScoreParams = {
      TableName: SCORES_TABLE,
      Key: { userId, quizId },
    };
    const getScoreCommand = new GetCommand(getScoreParams);
    let { Item: score } = await docClient.send(getScoreCommand);

    if (!score) {
      score = { userId, quizId, points: 0 };
    }

    if (isCorrect) {
      score.points = Math.max(0, score.points + 1);
    }

    const updateScoreParams = {
      TableName: SCORES_TABLE,
      Key: { userId, quizId },
      UpdateExpression: "set points = :points",
      ExpressionAttributeValues: {
        ":points": score.points,
      },
      ReturnValues: "UPDATED_NEW",
    };

    const updateCommand = new UpdateCommand(updateScoreParams);
    await docClient.send(updateCommand);

    // Return the response with the updated score
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: isCorrect ? "Correct answer!" : "Incorrect answer.",
        points: score.points,
      }),
    };
  } catch (error) {
    console.error("Error submitting answer:", error);
    return { statusCode: 500, body: JSON.stringify({ error: `Could not submit answer: ${error.message}` }) };
  }
};
