"""Database-structure for item-catalog."""

from flask_sqlalchemy import SQLAlchemy
import bleach
db = SQLAlchemy()


def verifyName(name):
    """Verify the name."""
    if not (2 < len(name) < 30):
        raise ValueError(
            "Name should be between 2 and 30 characters")


def verifyDescription(description):
    """Verify the description."""
    if not (3 < len(description) < 500):
        raise ValueError(
            "Description should be between 3 and 30 characters")


class Place(db.Model):
    """Catagories-table."""
    __tablename__ = 'place'
    id = db.Column(db.Integer, primary_key=True, unique=True)
    archived = db.Column(db.Boolean, unique=False, default=False)
    name = db.Column(db.String(50))
    description = db.Column(db.String(500))
    longitude = db.Column(db.Float)
    latitude = db.Column(db.Float)
    zoom = db.Column(db.Float)

    @classmethod
    def get_by_id(cls, place_id):
        """Return an object by its id."""
        place = Place.query.filter_by(id=place_id).first()
        if place:
            return place
        raise ValueError(
            "Could not find a place with id '{}'".format(place_id))

    @classmethod
    def create(cls, name, description, longitude, latitude, zoom):
        """Create a place."""
        verifyName(name)
        verifyDescription(description)
        place = Place(
            name=bleach.clean(name),
            description=bleach.clean(description),
            longitude=longitude,
            latitude=latitude,
            zoom=zoom
        )
        db.session.add(place)
        db.session.commit()

    @classmethod
    def edit(cls, place_id, name, description, longitude, latitude, zoom):
        """Edit a place."""
        verifyName(name)
        verifyDescription(description)
        place = Place.get_by_id(place_id)
        place.name = name
        place.longitude = longitude
        place.latitude = latitude
        place.zoom = zoom
        db.session.commit()

    @classmethod
    def delete(cls, place_id, created_by_user_id):
        """Delete a place."""
        place = Place.get_by_id(place_id)
        place.archived = True
        db.session.commit()

    @property
    def serialize(self):
        """Return object data in easily serializeable format"""
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'coordinates': {
                'longitude': self.longitude,
                'latitude': self.latitude,
            },
            'zoom': self.zoom
        }


class Marker(db.Model):
    """Catagory-items-table."""
    __tablename__ = 'marker'
    id = db.Column(db.Integer, primary_key=True)
    archived = db.Column(db.Boolean, unique=False, default=False)
    name = db.Column(db.String(50))
    description = db.Column(db.String(500))
    place_id = db.Column(db.Integer, db.ForeignKey(Place.id))
    longitude = db.Column(db.Float)
    latitude = db.Column(db.Float)
    marker_type = db.Column(db.String(50))
    place = db.relationship(
        Place, primaryjoin='Marker.place_id==Place.id')

    @classmethod
    def get_by_id(cls, marker_id):
        """Return a marker-object by its id."""
        marker = Marker.query.filter_by(id=marker_id).first()
        if marker:
            return marker
        raise ValueError(
            "Could not find an marker with id '{}'".format(marker_id))

    @classmethod
    def create(cls, marker_type, name,
               description, longitude, latitude):
        """Create a marker."""
        verifyName(name)
        verifyDescription(description)
        cat_item = Marker(
            name=bleach.clean(name),
            marker_type=bleach.clean(marker_type),
            description=bleach.clean(description),
            longitude=longitude,
            latitude=latitude
        )
        db.session.add(cat_item)
        db.session.commit()

    @classmethod
    def edit(cls, marker_id, marker_type, name,
             description, longitude, latitude):
        """Edit a marker."""
        verifyName(name)
        verifyDescription(description)
        marker = Marker.get_by_id(marker_id)
        marker.marker_type = marker_type
        marker.name = name
        marker.description = description
        marker.longitude = longitude
        marker.latitude = latitude
        db.session.commit()

    @classmethod
    def delete(cls, marker_id, longitude):
        """Delete a marker."""
        marker = Marker.get_by_id(marker_id)
        marker.archived = True
        db.session.commit()

    @property
    def serialize(self):
        """Return object data in easily serializeable format"""
        # place = Place.query.filter_by(
        #     id=self.place_id).first()
        # if place:
        #     place_name = place.name
        # else:
        #     place_name = 'noname'
        return {
            'id': self.id,
            'marker_type': self.marker_type,
            'name': self.name,
            'description': self.description,
            'coordinates': {
                'longitude': self.longitude,
                'latitude': self.latitude,
            },
            'latitude': self.latitude,
            'place_id': self.place_id
        }
