from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from flask_restx import Api
from config import config

# Application version
__version__ = '1.0.0'

db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()


def create_app(config_name='default'):
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    
    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    CORS(app)
    
    # Initialize API with Swagger documentation
    api = Api(
        app,
        version='1.0',
        title='Task Manager API',
        description='A comprehensive task management application API',
        doc='/api/docs',
        authorizations={
            'Bearer': {
                'type': 'apiKey',
                'in': 'header',
                'name': 'Authorization',
                'description': 'JWT Authorization header using the Bearer scheme. Example: "Authorization: Bearer {token}"'
            }
        },
        security='Bearer'
    )
    
    # Register error handlers
    from app.utils.error_handlers import register_error_handlers
    register_error_handlers(app)
    
    # Register API blueprints
    from app.api.auth import auth_ns
    from app.api.projects import projects_ns
    from app.api.tasks import tasks_ns
    from app.api.comments import comments_ns
    
    api.add_namespace(auth_ns, path='/api/auth')
    api.add_namespace(projects_ns, path='/api/projects')
    api.add_namespace(tasks_ns, path='/api/tasks')
    api.add_namespace(comments_ns, path='/api/comments')
    
    # Import models to ensure they are registered with SQLAlchemy
    from app.models import user, project, task, comment, project_member
    
    @app.route('/api/health')
    def health_check():
        """Health check endpoint"""
        return {'status': 'healthy', 'message': 'Task Manager API is running'}
    
    return app