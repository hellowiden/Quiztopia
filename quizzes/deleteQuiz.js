// Path: quizzes/deleteQuiz.js

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, DeleteCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import middy from "@middy/core";
import jwt from "jsonwebtoken";
import httpErrorHandler from '@middy/http-error-handler';
import httpEventNormalizer from '@middy/http-event-normalizer';
import httpHeaderNormalizer from '@middy/http-header-normalizer';

const client = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(client);

const QUIZZES_TABLE = process.env.QUIZZES_TABLE;
const JWT_SECRET = process.env.JWT_SECRET;

const deleteQuiz = async (event) => {
  const token = event.headers.authorization?.split(' ')[1];
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
}

export const handler = middy(deleteQuiz)
  .use(httpEventNormalizer()) 
  .use(httpHeaderNormalizer())
  .use(httpErrorHandler());
