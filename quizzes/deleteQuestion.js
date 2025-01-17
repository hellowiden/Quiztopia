// Path quizzes/deleteQuestion.js

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, DeleteCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import middy from "@middy/core";
import jwt from "jsonwebtoken";
import jsonBodyParser from '@middy/http-json-body-parser';
import httpErrorHandler from '@middy/http-error-handler';
import httpEventNormalizer from '@middy/http-event-normalizer';
import httpHeaderNormalizer from '@middy/http-header-normalizer';

const client = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(client);

const QUESTIONS_TABLE = process.env.QUESTIONS_TABLE;
const QUIZZES_TABLE = process.env.QUIZZES_TABLE;
const JWT_SECRET = process.env.JWT_SECRET;

const deleteQuestion = async (event) => {
  const token = event.headers.authorization?.split(' ')[1];
  const { quizId, questionId } = event.pathParameters;

  if (!token || !quizId || !questionId) {
    return { statusCode: 400, body: JSON.stringify({ error: "Missing fields or token" }) };
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Fetch the quiz to verify ownership
    const getQuizParams = {
      TableName: QUIZZES_TABLE,
      Key: { quizId },
    };
    const getQuizCommand = new GetCommand(getQuizParams);
    const { Item: quiz } = await docClient.send(getQuizCommand);

    if (!quiz || quiz.creator !== decoded.userId) {
      return { statusCode: 403, body: JSON.stringify({ error: "You are not authorized to delete questions in this quiz" }) };
    }

    // Delete the question from the QuestionsTable
    const deleteParams = {
      TableName: QUESTIONS_TABLE,
      Key: { questionId, quizId },
    };

    const deleteCommand = new DeleteCommand(deleteParams);
    await docClient.send(deleteCommand);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Question deleted successfully" }),
    };
  } catch (error) {
    console.error("Error deleting question:", error);
    return { statusCode: 500, body: JSON.stringify({ error: `Could not delete question: ${error.message}` }) };
  }
}

export const handler = middy(deleteQuestion)
  .use(jsonBodyParser())
  .use(httpEventNormalizer()) 
  .use(httpHeaderNormalizer())
  .use(httpErrorHandler());
