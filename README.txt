# Kinde Authentication Backend

This repository implements a Node.js backend with Kinde integration for authentication, implementing multi-tenancy architecture. The project demonstrates:

1. Integration with Kinde.com for user authentication, organization management, and role-based access control
2. Implementation of multi-tenancy architecture where users belong to organizations with specific roles
3. Unit testing with Jest and Supertest to ensure API functionality

## Features

- User signup with organization and role creation/assignment
- User login with JWT authentication
- Protected routes using JWT middleware
- Integration with Kinde API for user/organization/role management
- Complete unit tests for API endpoints

## Stack

- Node.js/Express.js
- MongoDB with Mongoose
- JWT for authentication
- Bcrypt for password hashing
- Kinde.com API integration
- Jest and Supertest for testing

## Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Create `.env` file with:
   - JWT_SECRET=your_secret_key
   - PORT=3000 (optional)
   - MONGO_URI_TEST=your_test_mongodb_uri (for testing)

## Running

- Development: `npm start`
- Testing: `npm test`

## API Endpoints

- POST /api/signup - Create new user with organization and role
- POST /api/login - Authenticate user and receive JWT
- GET /api/profile - Get user profile (requires authentication)

## Project Structure

- server.js - Main Express application
- tests/auth.test.js - API tests
- .env - Environment variables
start command is node start.js
and for test- the command is npm test
AI-TOOL USED:AI BOT IN THE API DOCS OF KINDE WEBSITE