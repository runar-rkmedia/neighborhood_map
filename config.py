"""Set up configuration."""
import os


class BaseConfig(object):
    """Base Config."""
    DEBUG = False
    TESTING = False
    SQLALCHEMY_DATABASE_URI = 'sqlite://'
    # In production, a truly random key shoud be stored in a production-config,
    # which will override this. For dev-purposes, just use 'dev' as secret key.
    SECRET_KEY = 'dev'
    SQLALCHEMY_TRACK_MODIFICATIONS = False


class DevelopmentConfig(BaseConfig):
    """Configuration for development."""
    DEBUG = True
    TESTING = False
    SQLALCHEMY_DATABASE_URI = 'sqlite:///map.db'
    SECRET_KEY = 'dev'
    os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'


class TestingConfig(BaseConfig):
    """Configuration for testing."""
    DEBUG = False
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite://'
    SECRET_KEY = 'dev'


config = {
    "development": "config.DevelopmentConfig",
    "testing": "config.TestingConfig",
    "default": "config.DevelopmentConfig"
}


def configure_app(app):
    """Retrieve configuration based on situation(dev,testing,production)."""
    config_name = os.getenv('FLASK_CONFIGURATION', 'default')
    app.config.from_object(config[config_name])
    app.config.from_pyfile('config.cfg', silent=True)
