// Path: quizzes/addQuestion.js

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import middy from "@middy/core";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import jsonBodyParser from '@middy/http-json-body-parser';
import httpErrorHandler from '@middy/http-error-handler';
import httpEventNormalizer from '@middy/http-event-normalizer';
import httpHeaderNormalizer from '@middy/http-header-normalizer';

const client = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(client);

const QUESTIONS_TABLE = process.env.QUESTIONS_TABLE;
const QUIZZES_TABLE = process.env.QUIZZES_TABLE;
const JWT_SECRET = process.env.JWT_SECRET;

const addQuestion = async (event) => {
  const token = event.headers.authorization?.split(' ')[1];
  const { quizId } = event.pathParameters;
  const { questionText, correctAnswer, longitude, latitude } = event.body;

  if (!token || !quizId || !questionText || !correctAnswer || !longitude || !latitude) {
    return { statusCode: 400, body: JSON.stringify({ error: "Missing required fields or token" }) };
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Fetch the quiz to check ownership
    const getQuizParams = {
      TableName: QUIZZES_TABLE,
      Key: { quizId },
    };

    const getQuizCommand = new GetCommand(getQuizParams);
    const { Item: quiz } = await docClient.send(getQuizCommand);

    // Check if the quiz exists and the user is the owner
    if (!quiz || quiz.creator !== decoded.userId) {
      return { statusCode: 403, body: JSON.stringify({ error: "You are not authorized to add questions to this quiz" }) };
    }

    // Create a unique questionId
    const questionId = uuidv4();

    // Add the question to the QuestionsTable
    const putParams = {
      TableName: QUESTIONS_TABLE,
      Item: {
        questionId,
        quizId,
        questionText,
        correctAnswer,
        coordinates: { longitude, latitude }, 
      },
    };

    const putCommand = new PutCommand(putParams);
    await docClient.send(putCommand);

    return {
      statusCode: 201,
      body: JSON.stringify({
        message: "Question added successfully",
        questionId,
      }),
    };
  } catch (error) {
    console.error("Error adding question:", error);
    return { statusCode: 500, body: JSON.stringify({ error: `Could not add question: ${error.message}` }) };
  }
}

export const handler = middy(addQuestion)
  .use(jsonBodyParser())
  .use(httpEventNormalizer()) 
  .use(httpHeaderNormalizer())
  .use(httpErrorHandler());
