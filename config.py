"""Set up configuration."""
import os


class BaseConfig(object):
    """Base Config."""
    print('base config')
    DEBUG = False
    TESTING = False
    SQLALCHEMY_DATABASE_URI = os.environ['DATABASE_URL']
    # In production, a truly random key shoud be stored in a production-config,
    # which will override this. For dev-purposes, just use 'dev' as secret key.
    # SECRET_KEY = 'dev'
    SQLALCHEMY_TRACK_MODIFICATIONS = False


class DevelopmentConfig(BaseConfig):
    """Configuration for development."""
    print('dev config')
    DEBUG = True
    TESTING = False
    SECRET_KEY = 'dev'
    os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'


class TestingConfig(BaseConfig):
    """Configuration for testing."""
    print('testing config')
    DEBUG = False
    TESTING = True
    # SQLALCHEMY_DATABASE_URI = os.environ['DATABASE_URL']
    # SECRET_KEY = 'dev'


config = {
    "development": "config.DevelopmentConfig",
    "testing": "config.TestingConfig",
    "default": "config.DevelopmentConfig"
}


def configure_app(app):
    """Retrieve configuration based on situation(dev,testing,production)."""
    config_name = os.getenv('FLASK_CONFIGURATION', 'default')
    print("Configuring app with '{}'-config.".format(config_name))
    app.config.from_object(config[config_name])
    app.config.from_pyfile('config.cfg', silent=True)

    print("Current config reads \n'{}'.".format(app.config))
