function SidepanelView() {
    // Data
    var self = this;

    self.google = ko.observable(!!window.google);
    self.chosenPlaceId = ko.observable();
    self.currentPlaceData = ko.observable();
    self.showPlacesList = ko.observable();
    self.showMarkersList = ko.observable(true);
    self.places = ko.observableArray();
    self.markers = ko.observableArray();
    $.get("/json/places/", function(data) {
        self.places(data.places);
        self.showPlacesList(true);
        if (!self.currentPlaceData()) {
            self.currentPlaceData(data.places[0]);
        }
    });

    self.centerMap = ko.computed(function() {
        if (self.google() && self.currentPlaceData()) {
            var place = self.currentPlaceData();
            map.setCenter({
                lat: place.latitude,
                lng: place.longitude
            });
            map.setZoom(place.zoom);
        }
    });
    self.putmarkers = ko.computed(function() {
        if (self.google() && self.markers().length > 0) {
            console.log(self.markers().length);
            for (var i = 0; i < self.markers().length; i++) {
                var this_marker = self.markers()[i];
                console.log(this_marker.name);
                new google.maps.Marker({
                    position: {
                        lat: this_marker.latitude,
                        lng: this_marker.longitude
                    },
                    map: map,
                    title: 'Hello World!'
                });
            }
        }
    });
    self.changePlace = function(place) {
        self.currentPlaceData(place);
        self.showPlacesList(false);
    };
    self.retrieveMarkers = ko.computed(function() {
        if (self.currentPlaceData()) {
            $.get("/json/places/" + self.currentPlaceData().id, function(data) {
                self.markers(data.markers);
                // console.log(data);
            });
        }
    });
}

ko.applyBindings(new SidepanelView());
