// Path: quizzes/updateQuiz.js

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
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

const updateQuiz = async (event) => {
  const token = event.headers.authorization?.split(' ')[1];
  const { quizId } = event.pathParameters;
  const { name } = event.body;

  if (!token || !quizId || !name) {
    return { statusCode: 400, body: JSON.stringify({ error: "Missing fields or token" }) };
  }

  try {

    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId;

 
    const getParams = {
      TableName: QUIZZES_TABLE,
      Key: { quizId },
    };

    const getCommand = new GetCommand(getParams);
    const { Item: quiz } = await docClient.send(getCommand);


    if (!quiz) {
      return { statusCode: 404, body: JSON.stringify({ error: "Quiz not found" }) };
    }

    if (quiz.creator !== userId) {
      return { statusCode: 403, body: JSON.stringify({ error: "You are not authorized to edit this quiz" }) };
    }

    const updateParams = {
      TableName: QUIZZES_TABLE,
      Key: { quizId },
      UpdateExpression: "set #name = :name",
      ExpressionAttributeNames: { "#name": "name" },
      ExpressionAttributeValues: { ":name": name },
      ReturnValues: "UPDATED_NEW",
    };

    const updateCommand = new UpdateCommand(updateParams);
    const result = await docClient.send(updateCommand);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Quiz updated successfully",
        updatedAttributes: result.Attributes,
      }),
    };
  } catch (error) {
    console.error("Error updating quiz:", error);
    return { statusCode: 500, body: JSON.stringify({ error: `Could not update quiz: ${error.message}` }) };
  }
}

export const handler = middy(updateQuiz)
  .use(jsonBodyParser())
  .use(httpEventNormalizer()) 
  .use(httpHeaderNormalizer())
  .use(httpErrorHandler());
