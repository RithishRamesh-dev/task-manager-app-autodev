import os
from app import create_app, db
from app.models.user import User
from app.models.project import Project
from app.models.task import Task
from app.models.comment import TaskComment
from app.models.project_member import ProjectMember

# Application version
__version__ = '1.0.0'

app = create_app(os.getenv('FLASK_CONFIG') or 'default')


@app.shell_context_processor
def make_shell_context():
    """Make database models available in Flask shell."""
    return {
        'db': db,
        'User': User,
        'Project': Project,
        'Task': Task,
        'TaskComment': TaskComment,
        'ProjectMember': ProjectMember
    }


if __name__ == '__main__':
    app.run(debug=True)