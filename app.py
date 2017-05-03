"""Udacity assignment for creating a Neighborhood-map."""

import sys
from config import configure_app
import requests
from flask import (
    Flask,
    request,
    jsonify,
    render_template,
)
from models import db, Place, Marker
from flask_scss import Scss
from werkzeug.contrib.cache import SimpleCache
from flask_assets import Environment, Bundle
cache = SimpleCache()


app = Flask(__name__, instance_relative_config=True)
configure_app(app)

assets = Environment(app)
js = Bundle('js/ko.js', 'js/map.js', 'js/bootstrap.js', 'js/skycons.js',
            filters='jsmin', output='gen/packed.js')
assets.register('js_all', js)

css = Bundle(
    'css/bootstrap.min.css',
    'css/style.css',
    filters='cssmin',
    output='css/min.css'
)
assets.register('css_all', css)


@app.route('/')
def view_map():
    """View for home."""
    return render_template(
        'map.html',
    )


@app.route('/json/yelp/', methods=['POST'])
def json_yelp():
    """Return a json of a yelp search."""

    latitude = request.form['latitude']
    longitude = request.form['longitude']
    term = request.form['term']
    sort_by = request.form['sort_by']
    if latitude and longitude:
        access_token = get_yelp_access_token()
        url = 'https://api.yelp.com/v3/businesses/search'
        headers = {'Authorization': 'bearer %s' % access_token}
        params = {
            'latitude': latitude,
            'longitude': longitude,
            'term': term,
            'sort_by': sort_by,
        }

        resp = requests.get(url=url, params=params, headers=headers)

        return app.response_class(resp, content_type='application/json')


def get_yelp_access_token():
    """Get and cache the access token from yelp."""
    app_id = app.config['YELP_CLIENT_ID']
    app_secret = app.config['YELP_CLIENT_SECRET']
    access_token = cache.get('yelp-token')
    if access_token is None:
        print('getting new token')
        data = {'grant_type': 'client_credentials',
                'client_id': app_id,
                'client_secret': app_secret}
        token = requests.post(
            'https://api.yelp.com/oauth2/token', data=data)
        access_token = token.json()['access_token']
        cache.set('yelp-token', access_token, timeout=60 * 60 * 24 * 90)
    return access_token


@app.route('/json/places/', methods=['GET'])
def json_places():
    """Return a json of the places."""
    places = Place.query.filter_by(archived=False).all()
    return jsonify(places=[i.serialize for i in places])


@app.route('/json/', methods=['GET'])
def json_places_and_markers():
    """Return a json of all places, and all markers"""
    places = Place.query.filter_by(archived=False).all()
    markers = Marker.query.filter_by(archived=False).all()
    places_json = jsonify(places=[i.serialize for i in places],
                          markers=[i.serialize for i in markers])
    return places_json


@app.route('/json/places/<int:place_id>/', methods=[
    'GET'])
def json_markers(place_id):
    """Handle JSON-requests for markers at a place"""
    markers = Marker.query.join(
        Marker.place
    ).filter(
        Marker.place_id == place_id,
        Place.archived == False,  # noqa
        Marker.archived == False,  # noqa
    ).all()
    return jsonify(markers=[i.serialize for i in markers])


@app.route('/json/places/<int:place_id>/<int:marker_id>/', methods=[
    'GET'])
def json_catalog_catagory_items(place_id, marker_id):
    """Handle JSON-requests for a marker"""
    marker = Marker.query.filter_by(
        place_id=place_id, id=marker_id, archived=False).first()
    return jsonify(marker.serialize)


# hook up extensions to app
db.init_app(app)
if __name__ == "__main__":
    if "--setup" in sys.argv:
        with app.app_context():
            db.drop_all()
            db.create_all()
            import setup
            for setup_place in setup.places:
                db.session.add(Place(**setup_place))
            for setup_marker in setup.markers:
                db.session.add(Marker(**setup_marker))
            db.session.commit()
            print("Database tables created")
    else:
        app.run(host='0.0.0.0', port=app.config['PORT'])
        get_yelp_access_token()

if app.config['DEBUG'] is True:
    # setup scss-folders
    Scss(app, static_dir='static/css/', asset_dir='assets/scss/')
