// Path: auth/login.js
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import middy from "@middy/core";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import jsonBodyParser from '@middy/http-json-body-parser';
import httpErrorHandler from '@middy/http-error-handler';
import httpEventNormalizer from '@middy/http-event-normalizer';
import httpHeaderNormalizer from '@middy/http-header-normalizer';

const client = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(client);

const USERS_TABLE = process.env.USERS_TABLE;
const JWT_SECRET = process.env.JWT_SECRET;

const login = async (event) => {
  
  const { userId, password } = event.body;

  if (!userId || !password) {
    return { statusCode: 400, body: JSON.stringify({ error: "userId and password are required" }) };
  }

  const params = {
    TableName: USERS_TABLE,
    Key: { userId },
  };

  try {
    const command = new GetCommand(params);
    const { Item } = await docClient.send(command);

    if (!Item) {
      return { statusCode: 401, body: JSON.stringify({ error: "Invalid credentials" }) };
    }

    const isMatch = await bcrypt.compare(password, Item.password);
    if (!isMatch) {
      return { statusCode: 401, body: JSON.stringify({ error: "Invalid credentials" }) };
    }

    const token = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "1h" });
    return { statusCode: 200, body: JSON.stringify({ message: "User logged in", token }) };
  } catch (error) {
    console.error("Error logging in user:", error);
    return { statusCode: 500, body: JSON.stringify({ error: `Could not log in user: ${error.message}` }) };
  }
}

export const handler = middy (login)
  .use(jsonBodyParser())
  .use(httpEventNormalizer()) 
  .use(httpHeaderNormalizer())
  .use(httpErrorHandler());
