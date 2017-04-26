"""Udacity assignment for creating a Neighborhood-map."""

import sys
from config import configure_app
from flask import (
    Flask,
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


@app.route('/json/places/', methods=['GET'])
def json_places():
    """Return a json of the places."""
    places = Place.query.filter_by(archived=False).all()
    return jsonify(places=[i.serialize for i in places])


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
        if app.debug:
            # setup scss-folders
            Scss(app, static_dir='static/css/', asset_dir='assets/scss/')
            app.run()
