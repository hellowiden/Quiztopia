// Path: users/listUsers.js

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";
import jsonBodyParser from '@middy/http-json-body-parser';
import httpErrorHandler from '@middy/http-error-handler';
import httpEventNormalizer from '@middy/http-event-normalizer';
import httpHeaderNormalizer from '@middy/http-header-normalizer';

import middy from "@middy/core";
const client = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(client);

const USERS_TABLE = process.env.USERS_TABLE;

const listUsers = async () => {
  const params = {
    TableName: USERS_TABLE,
  };

  try {
    const command = new ScanCommand(params);
    const { Items: users } = await docClient.send(command);

    return { statusCode: 200, body: JSON.stringify({ users }) };
  } catch (error) {
    console.error("Error retrieving users:", error);
    return { statusCode: 500, body: JSON.stringify({ error: `Could not retrieve users: ${error.message}` }) };
  }
}

export const handler = middy(listUsers)
  .use(jsonBodyParser())
  .use(httpEventNormalizer()) 
  .use(httpHeaderNormalizer())
  .use(httpErrorHandler());
