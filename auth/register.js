// Path: auth/register.js

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import middy from "@middy/core";
import bcrypt from "bcryptjs";
import jsonBodyParser from '@middy/http-json-body-parser';
import httpErrorHandler from '@middy/http-error-handler';
import httpEventNormalizer from '@middy/http-event-normalizer';
import httpHeaderNormalizer from '@middy/http-header-normalizer';

const client = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(client);

const USERS_TABLE = process.env.USERS_TABLE;

const register = async (event) => {
  const { userId, name, password } = event.body;

  if (!userId || !name || !password) {
    return { statusCode: 400, body: JSON.stringify({ error: "userId, name, and password are required" }) };
  }

  const getParams = {
    TableName: USERS_TABLE,
    Key: { userId },
  };

  try {
    const getUserCommand = new GetCommand(getParams);
    const { Item } = await docClient.send(getUserCommand);

    if (Item) {
      return { statusCode: 400, body: JSON.stringify({ error: "User already exists" }) };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const putParams = {
      TableName: USERS_TABLE,
      Item: { userId, name, password: hashedPassword },
    };

    const putCommand = new PutCommand(putParams);
    await docClient.send(putCommand);

    return { statusCode: 201, body: JSON.stringify({ message: "User registered successfully", userId }) };
  } catch (error) {
    console.error("Error registering user:", error);
    return { statusCode: 500, body: JSON.stringify({ error: `Could not register user: ${error.message}` }) };
  }
}
export const handler = middy(register)
  .use(jsonBodyParser())
  .use(httpEventNormalizer()) 
  .use(httpHeaderNormalizer())
  .use(httpErrorHandler());