# Hackathon Registration API

A simple Node.js + Express API for hackathon registration with MongoDB.

## Features

- Register participants for a hackathon
- Manage teams
- Track hackathon applications

## Models

1. **Participant**: Store information about individual participants
2. **Team**: Manage team registrations and their statuses

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or remote)

### Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd <repository-name>
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a .env file:
   ```
   cp .env.example .env
   ```

4. Configure your environment variables in the .env file:
   - Set the `PORT` (default: 3000)
   - Set the `MONGODB_URI` for your MongoDB connection

5. Start the development server:
   ```
   npm run dev
   ```

## API Routes

### Participants

- `POST /api/participants` - Create new participant
- `GET /api/participants` - List all participants
- `GET /api/participants/:id` - Get a single participant
- `PUT /api/participants/:id` - Update a participant

### Teams

- `POST /api/teams` - Create new team
- `GET /api/teams` - List all teams
- `GET /api/teams/:id` - Get a single team with populated participants
- `PUT /api/teams/:id` - Update a team (especially status)

## Response Format

All API responses follow this format:
```json
{
  "success": true|false,
  "data": {} or [],
  "error": "Error message (if success=false)"
}
``` 