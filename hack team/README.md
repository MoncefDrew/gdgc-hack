# Hackathon Registration API

A simple Node.js + Express API for hackathon registration with MongoDB.

## Features

- Register participants for a hackathon
- Email verification for participants
- Manage teams (max 4 participants per team)
- Track hackathon applications

## Models

1. **Participant**: Store information about individual participants
2. **Team**: Manage team registrations and their statuses (max 4 members)

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or remote)
- Email account for sending verification emails

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
   - Set the `BASE_URL` for your API (used in verification emails)
   - Configure email settings (`EMAIL_SERVICE`, `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM`)

5. Start the development server:
   ```
   npm run dev
   ```

## API Routes

### Participants

- `POST /api/participants/register` - Create new participant (automatically sends verification email)
- `GET /api/participants/verif-emaily/:token` - Verify participant email with token
- `POST /api/participants/resend-verification-email/:id` - Resend verification email
- `GET /api/get-all-participants` - List all participants
- `GET /api/get-participant-by-id/:id` - Get a single participant
- `PUT /api/update-participant/:id` - Update a participant

### Teams

- `POST /api/teams` - Create new team
- `GET /api/teams/get-all-teams` - List all teams
- `GET /api/teams/get-team-by-id/:id` - Get a single team with populated participants
- `PUT /api/teams/update-team/:id` - Update a team (especially status)

## Response Format

All API responses follow this format:
```json
{
  "success": true|false,
  "data": {} or [],
  "error": "Error message (if success=false)"
}
```

## Email Verification

The API includes an email verification system:

1. When a participant registers, a verification token is generated and an email is sent
2. The participant must click the verification link in the email
3. The API verifies the token and marks the participant as verified
4. If needed, verification emails can be resent using the resend endpoint 

## Team Size Limit

The API enforces a maximum team size of 4 participants:

1. When creating a new participant, the system checks if their team already has 4 members
2. When updating a participant's team, the system verifies the new team has available space
3. The Team model includes validation to prevent exceeding the 4-participant limit
4. Appropriate error messages are returned if a team is at capacity 
