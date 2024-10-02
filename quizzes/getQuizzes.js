// Path: quizzes/getQuiz.js

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";
import middy from "@middy/core";
import jsonBodyParser from '@middy/http-json-body-parser';
import httpErrorHandler from '@middy/http-error-handler';
import httpEventNormalizer from '@middy/http-event-normalizer';
import httpHeaderNormalizer from '@middy/http-header-normalizer';

const client = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(client);

const QUIZZES_TABLE = process.env.QUIZZES_TABLE;

const getQuizzes = async () => {
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
}

export const handler = middy(getQuizzes)
  .use(httpEventNormalizer()) 
  .use(httpHeaderNormalizer())
  .use(httpErrorHandler());
