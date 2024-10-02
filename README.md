# Quiz and Leaderboard API - Serverless Framework Node Expressjs API backed by DynamoDB

This project is a serverless API application developed using Node.js and Expressjs, backed by DynamoDB. It provides an API for managing users, quizzes, questions, scores, and leaderboards, running on AWS using the Serverless Framework. The API handles user registration, login, quiz creation, and leaderboard management, with full JWT-based authentication for secure routes.

## Project Overview

This application serves as a quiz and leaderboard platform. Users can register, log in, create quizzes, add questions, and track their scores. Each quiz can be accessed publicly, but creating or modifying a quiz is restricted to authenticated users. The platform supports leaderboard tracking to rank users based on their quiz performance.

The serverless architecture ensures scalability by leveraging AWS Lambda and DynamoDB as the data store. It uses JWT-based authentication to secure routes that require user authorization.

## Architecture

- **Backend Framework**: Node.js + Express
- **Database**: DynamoDB (AWS)
- **Authentication**: JWT (JSON Web Tokens)
- **Hosting and Scalability**: Serverless Framework, AWS Lambda
- **Middleware**: Helmet (for security), CORS (Cross-Origin Resource Sharing)
- **Error Handling**: Express middleware for 404 and general error handling

## Features

- **User Authentication**: Register, login, and JWT-protected routes.
- **Quiz Management**: Create, update, delete quizzes, and add questions to quizzes.
- **Leaderboard**: Track and display scores for quizzes.
- **Serverless Architecture**: Fully serverless deployment using AWS Lambda and DynamoDB.
- **Secure API**: JWT-based authentication for user-related actions and quiz modifications.
