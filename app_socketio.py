#!/usr/bin/env python3
"""
Task Manager Application with WebSocket Support
Main application entry point with Flask-SocketIO integration
"""

import os
from app import create_app, socketio, db
from flask_migrate import upgrade

# Create application instance
app = create_app(os.getenv('FLASK_ENV', 'default'))

@app.cli.command()
def deploy():
    """Run deployment tasks."""
    # Skip table creation in production to avoid startup crashes
    # Tables are pre-created in PostgreSQL database
    import os
    if os.environ.get('FLASK_ENV') != 'production':
        # Create database tables only in non-production environments
        db.create_all()
        
        # Migrate database to latest revision
        upgrade()

@app.shell_context_processor
def make_shell_context():
    """Make database models available in shell context."""
    from app.models.user import User
    from app.models.project import Project
    from app.models.task import Task
    from app.models.comment import TaskComment
    from app.models.project_member import ProjectMember
    
    return {
        'db': db,
        'User': User,
        'Project': Project,
        'Task': Task,
        'TaskComment': TaskComment,
        'ProjectMember': ProjectMember,
        'app': app,
        'socketio': socketio
    }

with app.app_context():
    """Test database connection on startup."""
    try:
        # Just test the connection, don't create tables
        db.session.execute(db.text("SELECT 1"))
        print("Database connection successful")
    except Exception as e:
        print(f"Database connection error: {e}")
        print("Application will continue without database verification")

# Health check endpoint is defined in app/__init__.py at /api/health

# WebSocket status endpoint
@app.route('/websocket/status')
def websocket_status():
    """WebSocket status endpoint."""
    from app.websocket.events import connected_users, user_rooms
    
    return {
        'websocket_enabled': True,
        'connected_users': len(connected_users),
        'active_rooms': len(user_rooms),
        'status': 'active'
    }

if __name__ == '__main__':
    # Run with SocketIO support
    socketio.run(
        app,
        host='0.0.0.0',
        port=int(os.environ.get('PORT', 5000)),
        debug=os.environ.get('FLASK_ENV') == 'development',
        allow_unsafe_werkzeug=True  # For development only
    )