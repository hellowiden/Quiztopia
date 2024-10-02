// quizzes/getQuestions.js

const AWS = require('aws-sdk');
const dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports.handler = async (event) => {
  const { quizId } = event.pathParameters;

  const params = {
    TableName: process.env.QUESTIONS_TABLE,
    IndexName: 'quizId-index',
    KeyConditionExpression: 'quizId = :quizId',
    ExpressionAttributeValues: {
      ':quizId': quizId,
    },
  };

  try {
    const result = await dynamoDb.query(params).promise();

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
