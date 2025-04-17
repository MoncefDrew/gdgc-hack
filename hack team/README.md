# Hackathon Registration API

A simple Node.js + Express API for hackathon registration with MongoDB.

## Features

- Register participants for a hackathon
- Email verification for participants
- Manage teams (max 4 participants per team)
- Track hackathon applications
- Middleware-based validation
- MVC architecture with controllers

## Models

1. **Participant**: Store information about individual participants
2. **Team**: Manage team registrations and their statuses (max 4 members)
3. **Admin** : Store informations about the administrator

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
   - Set the `JWT-SECRET`for json webtokens provider.

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

### Admin 

- `POST /api/admin/login` - perform an admin sign in  
- `POST /api/admin/forgot-password` - demand a new password change  
- `POST /api/admin/resetPassword` - change the password via the reset link  
- `GET /api/admin/teams` - get all teams or filter by status  
  - **Optional Query Parameter**:
    - `status`: Filter teams by their status (`Pending`, `Accepted`, `Rejected`)  
    - Example: `/api/admin/teams?status=Accepted`
- `GET /api/admin/participants` - get all registered users

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

## Middleware Architecture

The application uses middleware for various validations and operations:

1. **Team Validation Middleware**:
   - `checkTeamCapacity`: Ensures teams don't exceed 4 members during participant registration
   - `checkTeamChangeCapacity`: Ensures teams don't exceed 4 members when participants change teams

2. **General Middleware**:
   - Request logging middleware to log all incoming requests
   - Express JSON middleware for parsing request bodies
   - CORS middleware for cross-origin requests

These middleware components help maintain data integrity and improve code organization by centralizing validation logic.

## Controllers

The application follows the MVC (Model-View-Controller) pattern:

1. **Participant Controller**:
   - `createParticipant`: Handles participant registration
   - `verifyEmail`: Processes email verification
   - `resendVerificationEmail`: Resends verification emails
   - `getAllParticipants`: Retrieves all participants
   - `getParticipantById`: Retrieves a single participant
   - `updateParticipant`: Updates participant information

2. **Team Controller**:
   - `createTeam`: Creates a new team
   - `getAllTeams`: Retrieves all teams with participants
   - `getTeamById`: Retrieves a single team with participants
   - `updateTeam`: Updates team information
   - `getTeamStats`: Provides statistics about teams by status

3. **Admin Controller**:
   - `signup`: Creates a new admin account
   - `login`: sign in into the admin account
   - `forgotPassword`: request a link for the password reset
   - `resetPassword`: change the account password



This controller-based architecture helps organize business logic, separates concerns, and makes the codebase more maintainable. 
