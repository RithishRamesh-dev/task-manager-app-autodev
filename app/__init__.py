from flask import Flask, session
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from config import config
import requests
import os

db = SQLAlchemy()
migrate = Migrate()


def create_app(config_name='default'):
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    
    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    
    # Set API base URL for frontend to communicate with backend
    app.config['API_BASE_URL'] = os.environ.get('API_BASE_URL', 'http://localhost:5000')
    
    # Register frontend blueprints
    from app.frontend.auth import auth_bp
    from app.frontend.dashboard import dashboard_bp
    from app.frontend.projects import projects_bp
    from app.frontend.tasks import tasks_bp
    
    app.register_blueprint(auth_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(projects_bp, url_prefix='/projects')
    app.register_blueprint(tasks_bp, url_prefix='/tasks')
    
    # Import models to ensure they are registered with SQLAlchemy
    from app.models import user, project, task, comment, project_member
    
    @app.context_processor
    def inject_user():
        """Make user session data available in all templates"""
        return dict(
            current_user=session.get('user'),
            is_authenticated=bool(session.get('access_token'))
        )
    
    return app