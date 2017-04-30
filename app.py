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


app = Flask(__name__, instance_relative_config=True)
configure_app(app)


@app.route('/')
def view_map():
    """View for home."""
    return render_template(
        'map.html',
    )


@app.route('/json/yelp/', methods=['POST'])
def json_yelp():
    """Return a json of a yelp search."""

    app_id = app.config['YELP_CLIENT_ID']
    app_secret = app.config['YELP_CLIENT_SECRET']
    latitude = request.form['latitude']
    longitude = request.form['longitude']
    term = request.form['term']
    pricing_filter = request.form['pricing_filter']
    print(pricing_filter)
    if latitude and longitude:
        data = {'grant_type': 'client_credentials',
                'client_id': app_id,
                'client_secret': app_secret}
        token = requests.post('https://api.yelp.com/oauth2/token', data=data)
        access_token = token.json()['access_token']
        url = 'https://api.yelp.com/v3/businesses/search'
        headers = {'Authorization': 'bearer %s' % access_token}
        params = {
            'latitude': latitude,
            'longitude': longitude,
            'term': term,
            'pricing_filter': pricing_filter,
            'sort_by': 'rating'
        }

        resp = requests.get(url=url, params=params, headers=headers)

        return app.response_class(resp, content_type='application/json')


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
        print(app.config['DEBUG'])
        app.run()

if app.config['DEBUG'] is True:
    # setup scss-folders
    Scss(app, static_dir='static/css/', asset_dir='assets/scss/')
