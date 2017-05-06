"""Set up configuration."""
import os


class BaseConfig(object):
    """Base Config."""
    DEBUG = False
    TESTING = False
    PORT = int(os.environ.get("PORT", 5000))
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        'DATABASE_URL', 'sqlite:///neighborhood.db')
    YELP_CLIENT_ID = os.environ.get(
        'YELP_CLIENT_ID', None)
    YELP_CLIENT_SECRET = os.environ.get(
        'YELP_CLIENT_SECRET', None)
    # In production, a truly random key shoud be stored in a production-config,
    # which will override this. For dev-purposes, just use 'dev' as secret key.
    # SECRET_KEY = 'dev'
    SQLALCHEMY_TRACK_MODIFICATIONS = False


class DevelopmentConfig(BaseConfig):
    """Configuration for development."""
    DEBUG = True
    TESTING = False
    SECRET_KEY = 'dev'
    os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'


class TestingConfig(BaseConfig):
    """Configuration for testing."""
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
    required_keys = ['SQLALCHEMY_DATABASE_URI',
                     'YELP_CLIENT_ID', 'YELP_CLIENT_SECRET']
    app.config.from_pyfile('config.cfg', silent=True)
    for key in required_keys:
        if not app.config[key]:
            raise ValueError(
                "Required key '{}' missing. See Readme".format(key)
                )
