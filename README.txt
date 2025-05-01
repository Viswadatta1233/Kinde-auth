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
   PORT=3000
MONGODB_URI=mongodb+srv://viswa:datta12345@cluster0.xrgo6.mongodb.net/kinde?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=your_jwt_secret_here
KINDE_ISSUER_URL=https://shopifynew.kinde.com
KINDE_CLIENT_ID=b81a4b7be0664577a4cfc9229ba77606
KINDE_CLIENT_SECRET=vi3smAL0rFFrHQfrR5kzqu90Psz2A9Uxclb6TZOOyLCrnxEV4v26
KINDE_AUDIENCE=https://shopifynew.kinde.com/api
## Running

- Development: `npm start`
- Testing: `npm test`

## API Endpoints

- POST /api/signup - Create new user with organization and role
- POST /api/login - Authenticate user and receive JWT
- GET /api/profile - Get user profile (requires authentication)

## Project Structure

-start.js - Main Express application
-config/db.js for db connection
-middleware/auth.js for middleware
-controllers/authController.js for the auth controllers
-services/kindeService.js for service layer
-models/User.js has User model.
-tests/auth.test.js - API tests
-.env - Environment variables
start command is node start.js
and for test- the command is npm test
AI-TOOL USED:AI BOT IN THE API DOCS OF KINDE WEBSITE