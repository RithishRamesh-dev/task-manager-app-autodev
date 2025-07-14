# WebSocket Integration Guide

This guide explains how to integrate and use the real-time WebSocket functionality in the Task Manager application.

## Overview

The WebSocket implementation provides real-time updates for:
- Task creation, updates, and deletions
- Project updates
- Comment additions
- User presence and typing indicators
- Real-time notifications
- Online user tracking

## Technical Stack

- **Backend**: Flask-SocketIO with threading async mode
- **Frontend**: Socket.IO client with custom event handlers
- **Authentication**: JWT token or session-based authentication
- **Transport**: WebSocket with polling fallback

## Setup Instructions

### 1. Backend Setup

The WebSocket functionality is already integrated into the Flask application:

```python
# app/__init__.py
from flask_socketio import SocketIO
socketio = SocketIO()

def create_app(config_name='default'):
    app = Flask(__name__)
    # ... other setup ...
    socketio.init_app(app, cors_allowed_origins="*", async_mode='threading')
    # Register WebSocket events
    from app.websocket import events
    return app
```

### 2. Running the Application with WebSocket Support

Use the provided `app_socketio.py` file to run the application with WebSocket support:

```bash
python app_socketio.py
```

Or with Gunicorn for production:

```bash
gunicorn --worker-class eventlet -w 1 app_socketio:app
```

### 3. Frontend Integration

Include the Socket.IO client and WebSocket integration in your templates:

```html
<!-- Include Socket.IO client -->
<script src="https://cdn.socket.io/4.7.2/socket.io.min.js"></script>

<!-- Include WebSocket client -->
<script src="{{ url_for('static', filename='js/websocket.js') }}"></script>

<!-- Include main application JS with WebSocket integration -->
<script src="{{ url_for('static', filename='js/app.js') }}"></script>
```

### 4. Template Integration

Add the WebSocket base template content to your main `base.html`:

```html
<!-- Add the content from app/templates/websocket_base.html -->
```

## WebSocket Events

### Client-to-Server Events

- `connect` - Establish connection and authenticate
- `join_project` - Join a project room for updates
- `leave_project` - Leave a project room
- `task_created` - Notify about task creation
- `task_updated` - Notify about task updates
- `task_status_changed` - Notify about status changes
- `task_deleted` - Notify about task deletion
- `comment_added` - Notify about new comments
- `project_updated` - Notify about project updates
- `user_typing` - Send typing indicators
- `get_online_users` - Request online users list
- `ping` - Keep connection alive

### Server-to-Client Events

- `connected` - Connection established successfully
- `task_created` - Task was created by another user
- `task_updated` - Task was updated by another user
- `task_deleted` - Task was deleted by another user
- `task_status_changed` - Task status was changed
- `comment_added` - New comment was added
- `project_updated` - Project was updated
- `user_connected` - User joined the project
- `user_disconnected` - User left the project
- `user_typing` - User is typing a comment
- `notification` - Real-time notification
- `online_users` - List of currently online users
- `error` - Error message
- `pong` - Response to ping

## Usage Examples

### 1. Joining a Project Room

```javascript
// Automatically join project room when viewing project
if (window.currentProjectId) {
    TaskManagerWebSocket.joinProject(window.currentProjectId);
}
```

### 2. Handling Real-time Task Updates

```javascript
TaskManagerWebSocket.on('taskUpdated', function(data) {
    console.log('Task updated:', data.task);
    // Update UI with new task data
    updateTaskInUI(data.task);
});
```

### 3. Sending Typing Indicators

```javascript
// Automatically handled for comment textareas
const textarea = document.querySelector('textarea[name="comment_text"]');
textarea.addEventListener('input', function() {
    TaskManagerWebSocket.sendTypingIndicator(taskId, true);
});
```

### 4. Displaying Online Users

```javascript
TaskManagerWebSocket.on('userConnected', function(data) {
    console.log(`${data.full_name} joined the project`);
    updateOnlineUsersList();
});
```

## Security Features

### Authentication

- JWT token authentication for WebSocket connections
- Session-based authentication fallback
- User verification for project access
- Room-based access control

### Authorization

- Users can only join project rooms they're members of
- Cross-project data leakage prevention
- User-specific notification delivery

## Configuration Options

### Client-Side Configuration

```javascript
TaskManagerWebSocket.init({
    autoReconnect: true,
    heartbeatInterval: 30000,
    typingTimeout: 3000,
    notificationTimeout: 5000
});
```

### Server-Side Configuration

```python
socketio.init_app(app, 
    cors_allowed_origins="*",
    async_mode='threading',
    ping_timeout=60,
    ping_interval=25
)
```

## Error Handling

### Connection Errors

- Automatic reconnection with exponential backoff
- Maximum retry limit to prevent infinite loops
- Graceful degradation when WebSocket is unavailable

### Authentication Errors

- Clear error messages for authentication failures
- Automatic disconnect for unauthorized users
- Session validation on each connection

## Performance Considerations

### Connection Management

- Heartbeat/ping system to maintain connections
- Automatic cleanup of disconnected users
- Room-based message delivery for efficiency

### Message Optimization

- Event-specific data serialization
- Minimal data transfer for typing indicators
- Batched updates where possible

## Monitoring and Debugging

### WebSocket Status Endpoint

```
GET /websocket/status
```

Returns information about WebSocket connections and active rooms.

### Debugging

Enable debug mode for detailed WebSocket logging:

```javascript
// Client-side debugging
TaskManagerWebSocket.config.debug = true;
```

```python
# Server-side debugging
socketio.run(app, debug=True)
```

## Production Deployment

### Requirements

- Redis or similar for session storage in multi-instance deployments
- Load balancer with sticky sessions or WebSocket clustering
- Proper CORS configuration for production domains

### Recommended Setup

```bash
# Install additional dependencies for production
pip install redis eventlet

# Run with Gunicorn and eventlet
gunicorn --worker-class eventlet -w 1 app_socketio:app
```

### Environment Variables

```bash
REDIS_URL=redis://localhost:6379/0
CORS_ALLOWED_ORIGINS=https://yourdomain.com
```

## Troubleshooting

### Common Issues

1. **Connection Refused**: Check if SocketIO is properly initialized
2. **Authentication Failed**: Verify JWT token or session authentication
3. **Events Not Received**: Ensure user has joined the correct project room
4. **Typing Indicators Not Working**: Check if task ID is properly detected

### Browser Compatibility

- Modern browsers with WebSocket support
- Automatic fallback to polling for older browsers
- Mobile browser compatibility included

## API Integration

The WebSocket events are automatically triggered from API endpoints when using the utility functions:

```python
from app.websocket.events import emit_task_created, emit_task_updated

# In your API endpoint
task = create_task(...)
emit_task_created(task, current_user)
```

## Future Enhancements

- File upload progress indicators
- Voice/video call integration
- Advanced presence indicators
- Message persistence and history
- Push notifications for mobile apps