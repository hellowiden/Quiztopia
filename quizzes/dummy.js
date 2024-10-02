import middy from '@middy/core';


export const handler = middy(async (event, context) => {
    return {
        statusCode: 200,
        body: JSON.stringify({ hello: 'world' })
    };
});
