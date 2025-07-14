from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_socketio import SocketIO
from config import config

db = SQLAlchemy()
migrate = Migrate()
socketio = SocketIO()


def create_app(config_name='default'):
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    
    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    socketio.init_app(app, cors_allowed_origins="*", async_mode='threading')
    
    # Import models to ensure they are registered with SQLAlchemy
    from app.models import user, project, task, comment, project_member
    
    # Register WebSocket events
    from app.websocket import events
    
    return app