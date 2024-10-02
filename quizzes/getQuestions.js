// quizzes/getQuestions.js
import AWS from 'aws-sdk';
import middy from "@middy/core";
import httpErrorHandler from '@middy/http-error-handler';
import httpEventNormalizer from '@middy/http-event-normalizer';
import httpHeaderNormalizer from '@middy/http-header-normalizer';

const dynamoDb = new AWS.DynamoDB.DocumentClient();

const getQuestion = async (event) => {
  const { quizId } = event.pathParameters;

  const params = {
    TableName: process.env.QUESTIONS_TABLE,
    FilterExpression: 'quizId = :quizId',
    ExpressionAttributeValues: {
      ':quizId': quizId,
    },
  };

  try {
    const result = await dynamoDb.scan(params).promise();

    return {
      statusCode: 200,
      body: JSON.stringify({
        questions: result.Items,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Could not fetch questions' }),
    };
  }
};

export const handler = middy(getQuestion)
  .use(httpEventNormalizer())
  .use(httpHeaderNormalizer())
  .use(httpErrorHandler());
