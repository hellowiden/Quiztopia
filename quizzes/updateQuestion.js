// Path quizzes/updateQuestion.js

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, UpdateCommand, GetCommand } = require("@aws-sdk/lib-dynamodb");
const jwt = require("jsonwebtoken");
const middy = require('@middy/core');
const jsonBodyParser = require('@middy/http-json-body-parser');
const httpErrorHandler = require('@middy/http-error-handler');
const httpEventNormalizer = require('@middy/http-event-normalizer');

const client = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(client);

const QUESTIONS_TABLE = process.env.QUESTIONS_TABLE;
const QUIZZES_TABLE = process.env.QUIZZES_TABLE;
const JWT_SECRET = process.env.JWT_SECRET;

const updateQuestion = async (event) => {
  const token = event.headers.Authorization?.split(' ')[1];
  const { quizId, questionId } = event.pathParameters;
  const { questionText, correctAnswer, coordinates } = event.body;

  if (!token || !quizId || !questionId || !questionText || !correctAnswer || !coordinates) {
    return { statusCode: 400, body: JSON.stringify({ error: "Missing fields or token" }) };
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    const getQuizParams = {
      TableName: QUIZZES_TABLE,
      Key: { quizId },
    };

    const getQuizCommand = new GetCommand(getQuizParams);
    const { Item: quiz } = await docClient.send(getQuizCommand);

    if (!quiz || quiz.creator !== decoded.userId) {
      return { statusCode: 403, body: JSON.stringify({ error: "You are not authorized to update questions in this quiz" }) };
    }

    const updateParams = {
      TableName: QUESTIONS_TABLE,
      Key: { questionId, quizId },
      UpdateExpression: "set questionText = :questionText, correctAnswer = :correctAnswer, coordinates = :coordinates",
      ExpressionAttributeValues: {
        ":questionText": questionText,
        ":correctAnswer": correctAnswer,
        ":coordinates": coordinates,
      },
      ReturnValues: "UPDATED_NEW",
    };

    const updateCommand = new UpdateCommand(updateParams);
    const result = await docClient.send(updateCommand);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Question updated successfully",
        updatedAttributes: result.Attributes,
      }),
    };
  } catch (error) {
    console.error("Error updating question:", error);
    return { statusCode: 500, body: JSON.stringify({ error: `Could not update question: ${error.message}` }) };
  }
};

// Wrap the handler with Middy and apply middleware
module.exports.handler = middy(updateQuestion)
  .use(jsonBodyParser())
  .use(httpEventNormalizer()) 
  .use(httpErrorHandler());
