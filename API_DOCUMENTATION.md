# Task Manager API Documentation

## Overview

The Task Manager API is a comprehensive RESTful API built with Flask-RESTX that provides full functionality for task and project management. The API includes authentication, project management, task CRUD operations, and commenting features.

## Base URL

```
Local Development: http://localhost:5000
Production: https://your-app-domain.com
```

## Interactive Documentation

The API includes interactive Swagger documentation available at:
- **Swagger UI**: `/api/docs`
- **Health Check**: `/api/health`

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

### Authentication Endpoints

#### POST /api/auth/register
Register a new user account.

**Request Body:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "full_name": "John Doe",
  "password": "password123"
}
```

**Response:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "full_name": "John Doe",
    "created_at": "2024-01-01T00:00:00",
    "is_active": true
  }
}
```

#### POST /api/auth/login
Login with username and password.

**Request Body:**
```json
{
  "username": "johndoe",
  "password": "password123"
}
```

#### GET /api/auth/profile
Get current user profile (requires authentication).

#### PUT /api/auth/profile
Update current user profile (requires authentication).

**Request Body:**
```json
{
  "full_name": "John Updated",
  "email": "john.updated@example.com"
}
```

#### POST /api/auth/refresh
Refresh access token using refresh token.

#### POST /api/auth/logout
Logout current user (requires authentication).

## Project Management

### Project Endpoints

#### GET /api/projects
Get list of user's projects (requires authentication).

**Response:**
```json
[
  {
    "id": 1,
    "name": "My Project",
    "description": "Project description",
    "owner_id": 1,
    "created_at": "2024-01-01T00:00:00",
    "updated_at": "2024-01-01T00:00:00",
    "is_active": true,
    "stats": {
      "total": 10,
      "completed": 3,
      "in_progress": 4,
      "pending": 3,
      "completion_rate": 30.0
    }
  }
]
```

#### POST /api/projects
Create a new project (requires authentication).

**Request Body:**
```json
{
  "name": "New Project",
  "description": "Project description"
}
```

#### GET /api/projects/{id}
Get project details (requires authentication and project access).

#### PUT /api/projects/{id}
Update project details (requires authentication and admin/owner permissions).

#### DELETE /api/projects/{id}
Delete project (requires authentication and owner permissions).

### Project Members

#### GET /api/projects/{id}/members
Get project members (requires authentication and project access).

#### POST /api/projects/{id}/members
Add member to project (requires authentication and admin/owner permissions).

**Request Body:**
```json
{
  "user_id": 2,
  "role": "member"
}
```

#### DELETE /api/projects/{id}/members/{user_id}
Remove member from project (requires authentication and admin/owner permissions).

#### GET /api/projects/{id}/analytics
Get project analytics and statistics (requires authentication and project access).

## Task Management

### Task Endpoints

#### GET /api/tasks
Get list of tasks with optional filtering (requires authentication).

**Query Parameters:**
- `project_id` (integer): Filter by project ID
- `status` (string): Filter by status (pending, in_progress, completed, cancelled)
- `priority` (string): Filter by priority (low, medium, high, critical)
- `assigned_to` (integer): Filter by assigned user ID
- `limit` (integer): Limit number of results
- `offset` (integer): Offset for pagination

**Response:**
```json
[
  {
    "id": 1,
    "title": "Implement authentication",
    "description": "Create login and registration functionality",
    "status": "in_progress",
    "priority": "high",
    "project_id": 1,
    "assigned_to": 2,
    "created_by": 1,
    "due_date": "2024-12-31T23:59:59",
    "created_at": "2024-01-01T00:00:00",
    "updated_at": "2024-01-01T00:00:00",
    "is_overdue": false,
    "comments_count": 3
  }
]
```

#### POST /api/tasks
Create a new task (requires authentication and project access).

**Request Body:**
```json
{
  "title": "New Task",
  "description": "Task description",
  "project_id": 1,
  "assigned_to": 2,
  "priority": "medium",
  "due_date": "2024-12-31T23:59:59"
}
```

#### GET /api/tasks/{id}
Get task details with comments (requires authentication and task access).

#### PUT /api/tasks/{id}
Update task details (requires authentication and edit permissions).

#### DELETE /api/tasks/{id}
Delete task (requires authentication and edit permissions).

#### PATCH /api/tasks/{id}/status
Update task status (requires authentication and edit permissions).

**Request Body:**
```json
{
  "status": "completed"
}
```

### Dashboard Endpoints

#### GET /api/tasks/dashboard/stats
Get user dashboard statistics (requires authentication).

**Response:**
```json
{
  "total_projects": 3,
  "total_tasks": 25,
  "assigned_tasks": 12,
  "created_tasks": 15,
  "completed_tasks": 8,
  "overdue_tasks": 2,
  "completion_rate": 66.67
}
```

#### GET /api/tasks/dashboard/recent
Get recent tasks for dashboard (requires authentication).

**Query Parameters:**
- `limit` (integer): Limit number of results (default: 10)

## Comment Management

### Comment Endpoints

#### GET /api/comments
Get comments for a specific task (requires authentication and task access).

**Query Parameters:**
- `task_id` (integer, required): Filter by task ID

#### POST /api/comments
Add a comment to a task (requires authentication and task access).

**Request Body:**
```json
{
  "task_id": 1,
  "comment_text": "This task is progressing well"
}
```

#### GET /api/comments/{id}
Get comment details (requires authentication and task access).

#### PUT /api/comments/{id}
Update comment text (requires authentication and comment ownership).

**Request Body:**
```json
{
  "comment_text": "Updated comment content"
}
```

#### DELETE /api/comments/{id}
Delete comment (requires authentication and appropriate permissions).

#### GET /api/comments/task/{task_id}
Alternative endpoint to get all comments for a specific task.

## Error Handling

The API uses standard HTTP status codes and returns detailed error messages:

### Error Response Format
```json
{
  "error": "Error Type",
  "message": "Detailed error message",
  "details": {
    "field": ["Field-specific error message"]
  }
}
```

### Common Status Codes
- `200` - Success
- `201` - Created
- `204` - No Content
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (resource already exists)
- `422` - Unprocessable Entity
- `429` - Rate Limit Exceeded
- `500` - Internal Server Error

## Rate Limiting

The API implements rate limiting to prevent abuse:
- **Authentication endpoints**: 10 requests per minute
- **General endpoints**: 100 requests per minute per user

## Data Validation

All API endpoints include comprehensive input validation:

### User Registration
- Username: 3-80 characters, alphanumeric and underscores only
- Email: Valid email format
- Password: Minimum 6 characters, must contain letters and numbers
- Full name: 1-200 characters

### Projects
- Name: 1-200 characters, required
- Description: Optional, maximum 1000 characters

### Tasks
- Title: 1-200 characters, required
- Description: Optional, maximum 2000 characters
- Status: One of: pending, in_progress, completed, cancelled
- Priority: One of: low, medium, high, critical
- Due date: Valid ISO datetime format

### Comments
- Comment text: 1-2000 characters, required

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: Secure password storage using werkzeug
- **Input Validation**: Comprehensive validation on all inputs
- **CORS Support**: Configurable cross-origin resource sharing
- **Rate Limiting**: Protection against abuse and DoS attacks
- **Error Handling**: Secure error messages that don't expose sensitive information

## Testing the API

### Using curl

```bash
# Register a user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "email": "test@example.com", "full_name": "Test User", "password": "password123"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "password": "password123"}'

# Create a project (replace TOKEN with actual JWT token)
curl -X POST http://localhost:5000/api/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"name": "Test Project", "description": "A test project"}'

# Get projects
curl -X GET http://localhost:5000/api/projects \
  -H "Authorization: Bearer TOKEN"
```

### Using the Swagger UI

1. Start the application
2. Navigate to `http://localhost:5000/api/docs`
3. Use the "Authorize" button to enter your JWT token
4. Test endpoints interactively

## Environment Variables

Required environment variables:

```bash
FLASK_APP=app.py
FLASK_ENV=development
SECRET_KEY=your-secret-key
DATABASE_URL=sqlite:///taskmanager_dev.db
JWT_SECRET_KEY=your-jwt-secret-key
```

## Getting Started

1. Install dependencies: `pip install -r requirements.txt`
2. Set up environment variables
3. Initialize database: `flask db upgrade`
4. Run the application: `flask run`
5. Access API documentation: `http://localhost:5000/api/docs`