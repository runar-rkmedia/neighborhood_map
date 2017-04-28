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
    // Center the map on a location whenever currentPlaceData changes
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
    // Place markers on map whenever markers changes
    self.putmarkers = ko.computed(function() {
        if (self.google() && self.markers().length > 0) {
            console.log(self.markers().length);
            for (var i = 0; i < self.markers().length; i++) {
                var largeInfowindow = new google.maps.InfoWindow();
                var this_marker = self.markers()[i];
                console.log(this_marker.name);
                var marker = new google.maps.Marker({
                    position: {
                        lat: this_marker.latitude,
                        lng: this_marker.longitude
                    },
                    map: map,
                    title: this_marker.name,
                    description: this_marker.description,
                    animation: google.maps.Animation.DROP,
                });

                // Push the marker to our array of markers.
                markers.push(marker);
                // Create an onclick event to open an infowindow at each marker.
                marker.addListener('click', function() {
                    populateInfoWindow(this, largeInfowindow);
                });
                // showListings()
            }
        }
    });
    // Change the current place to what a user selected
    self.changePlace = function(place) {
        if (self.currentPlaceData() !== place) {
            self.currentPlaceData(place);
        }
        // self.showPlacesList(false);
    };
    // Retrieve tha markers whenever the currentPlaceData changes. (caching?)
    self.retrieveMarkers = ko.computed(function() {
        hideListings();
        if (self.currentPlaceData()) {
            $.get("/json/places/" + self.currentPlaceData().id, function(data) {
                self.markers(data.markers);
                // console.log(data);
            });
        }
    });
}

ko.applyBindings(new SidepanelView());
