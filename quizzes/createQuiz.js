// Path: quizzes/createQuiz.js

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import middy from "@middy/core";
import jwt from "jsonwebtoken";
import jsonBodyParser from '@middy/http-json-body-parser';
import httpErrorHandler from '@middy/http-error-handler';
import httpEventNormalizer from '@middy/http-event-normalizer';
import httpHeaderNormalizer from '@middy/http-header-normalizer';

const client = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(client);

const QUIZZES_TABLE = process.env.QUIZZES_TABLE;
const JWT_SECRET = process.env.JWT_SECRET;

const createQuiz = async (event) => {
  
  const token = event.headers.authorization?.split(' ')[1];
  const { quizId, name } = event.body;

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
}

export const handler = middy(createQuiz)
  .use(jsonBodyParser())
  .use(httpEventNormalizer()) 
  .use(httpHeaderNormalizer())
  .use(httpErrorHandler());
