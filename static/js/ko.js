var largeInfowindow;

function SidepanelView() {
    // Data
    var self = this;

    // Currently selected
    self.currentPlaceData = ko.observable();
    self.currentGeoName = ko.observable();
    self.currentMarkers = ko.observableArray();
    self.currentWeather = ko.observable();

    // Data and caches
    self.placesData = ko.observableArray();
    self.markersData = ko.observableArray();
    self.markers = ko.observableArray();
    self.businesses = ko.observableArray();
    self.knownGeolocations = ko.observableArray();

    // Statuses
    self.errormsg = ko.observable();
    self.loading = ko.observable();
    self.loadingWeather = ko.observable();

    // User-input§
    self.yelpTerm = ko.observable();
    self.yelpSorting = ko.observable('best_match');
    self.userFilter = ko.observable();
    self.filterMarkerHereOnly = ko.observable(true);

    // Others
    self.refreshWeatherDummy = ko.observable();
    self.google = ko.observable(!!window.google);

    var skycons = new Skycons({
        "color": "black"
    });

    //*********** Filtering ***************//

    // Filter places on search
    self.filterPlaces = ko.computed(function() {
        if (!self.userFilter()) {
            return self.placesData();
        } else {
            return ko.utils.arrayFilter(self.placesData(), function(place) {
                return place.name.toLowerCase().indexOf(self.userFilter().toLowerCase()) != -1;
            });
        }
    });
    // Filter markers on search
    self.filterMarkers = ko.computed(function() {
        if (!self.userFilter()) {
            if (self.currentPlaceData() && self.filterMarkerHereOnly()) {
                return ko.utils.arrayFilter(self.markersData(), function(marker) {
                    return marker.place_id == self.currentPlaceData().id;
                });
            }
            return self.markersData();
        } else {
            return ko.utils.arrayFilter(self.markersData(), function(marker) {
                var filterHere = true;
                if (self.filterMarkerHereOnly()) {
                    filterHere = marker.place_id == self.currentPlaceData().id;
                }
                return marker.name.toLowerCase().indexOf(self.userFilter().toLowerCase()) != -1 && filterHere;
            });
        }
    });
    // Filter businesses on search
    self.filterBusinesses = ko.computed(function() {
        if (!self.yelpTerm() || self.lastYelpSearch == self.yelpTerm()) {
            return self.businesses();
        } else {
            return ko.utils.arrayFilter(self.businesses(), function(business) {
                return business.name.toLowerCase().indexOf(self.yelpTerm().toLowerCase()) != -1;
            });
        }
    });
    // Filter the visibility of markers on screen
    ko.computed(function() {
        var f = self.filterMarkers().concat(self.filterBusinesses());
        if (f && self.google() && markers.length > 0) {
            for (var i = 0; i < markers.length; i++) {
                thisMark = markers[i];
                var result = $.grep(f, function(e) { // jshint ignore:line
                    return e.id == thisMark.id;
                });
                if (result.length > 0) {
                    thisMark.setVisible(true);
                } else {
                    thisMark.setVisible(false);
                }
            }
        }
    });

    //*********** AJAX-Calls ***************//
    $.get("/json/")
        .done(function(data) {
            self.placesData(data.places);
            self.markersData(data.markers);
            if (!self.currentPlaceData()) {
                self.currentPlaceData(data.places[0]);
            }
            setMarkersForPlaceId(self.markersData(), self.currentPlaceData().id);
        })
        .fail(function(e) {
            self.errormsg('Could not retrieve data: Error ' + e.status);
        });

    // Retrieve restaurants from yelp
    var lastYelpSearch;
    self.getYelp = function(event) {
        var c = map.getCenter();
        var p = self.currentPlaceData();
        var term = "";
        if (self.yelpTerm()) {
            term = self.yelpTerm();
            lastYelpSearch = term;
        }
        if (p && c) {
            self.loading(true);
            $.post("/json/yelp/", {
                    'latitude': c.lat(),
                    'longitude': c.lng(),
                    'term': term,
                    'sort_by': self.yelpSorting,
                })
                .done(function(data) {
                    self.loading(false);
                    self.businesses(data.businesses);
                    self.currentMarkers(data.businesses);
                })
                .fail(function(e) {
                    console.log(e);
                    self.loading(false);
                    self.errormsg('Could not retrieve info from yelp: Error ' + e.status);
                });
        }
    };

    // Retrieve weather-data and geolocation
    // TODO: refactor
    ko.computed(function() {
        // this.extend({rateLimit: 2000})
        self.refreshWeatherDummy(); // In case of manual refresh
        if (self.google() && self.currentPlaceData()) {
            var c = map.getCenter();
            var lat = c.lat();
            var lng = c.lng();
            var location = {
                lat: lat,
                lng: lng
            };
            var index = keyValInArray(self.knownGeolocations(), location);
            if (index == -1) {
                self.knownGeolocations().push({
                    location: location
                });
                index = self.knownGeolocations().length - 1;
            }
            // Get weather if it is not cached and not forced
            if (!self.knownGeolocations()[index].weather || self.refreshWeatherDummy()) {
                self.refreshWeatherDummy(false);
                self.loadingWeather(true);
                $.ajax({
                        url: "https://api.darksky.net/forecast/3f65e872a94f76c3714f5a8093fe83fa/" + lat + "," + lng + '?exclude=minutely,hourly,daily,flags&units=si',
                        dataType: 'jsonp',
                    })
                    .done(function(data) {
                        self.currentWeather(data);
                        self.knownGeolocations()[index].weather = data;

                        self.loadingWeather(false);

                    })
                    .fail(function(e) {
                        console.log(e);
                        self.loadingWeather(false);
                        self.errormsg('Could not retrieve weather: Error ' + e.status);
                    });
            } else {
                self.currentWeather(self.knownGeolocations()[index].weather);
            }
            // Only retrieve geoinfo if it is not cached
            if (!self.knownGeolocations()[index].geoinfo) {
                geocoder.geocode({
                    'location': location
                }, function(results, status) {
                    if (status === 'OK') {
                        if (results[1]) {
                            self.currentGeoName(results[1].formatted_address);
                            self.knownGeolocations()[index].geoinfo = results;
                        } else {}
                    } else {
                        self.errormsg('Geocoder failed due to: ' + status);
                    }
                });
            } else {
                self.currentGeoName(self.knownGeolocations()[index].geoinfo[1].formatted_address);
            }
        }
    }).extend({
        deferred: true
    });
    ko.computed(function() {
        if (self.currentWeather()) {
            skycons.set("icon1", self.currentWeather().currently.icon);
            skycons.play();
        }
    });

    // Helper for matching a location-object inside an array of obhjects.
    function keyValInArray(array, locationObject) {
        for (var i = 0; i < array.length; i++) {
            var thisData = array[i];
            if (thisData.location.lat == locationObject.lat && thisData.location.lng == locationObject.lng) {
                return i;
            }
        }
        return -1;
    }
    // Refresh the weather manually
    self.refreshWeather = function() {
        self.refreshWeatherDummy(true);
    };

    //*********** Helpers ***************//
    function setMarkersForPlaceId(markers, place_id) {
        var array = [];
        // filter through markers for place.
        for (var i = 0; i < markers.length; i++) {
            var thisMark = markers[i];
            if (thisMark.place_id === place_id) {
                array.push(thisMark);
            }
        }
        if (self.currentMarkers() !== array) {
            self.currentMarkers(array);
        }
    }

    // Change the current place to what a user selected
    self.changePlace = function(place) {
        if (self.currentPlaceData() !== place) {
            self.currentPlaceData(place);
            setMarkersForPlaceId(self.markersData(), self.currentPlaceData().id);
        }
    };

    //*********** BOOTSTRAP ***************//
    // When going to the Markers-tab, zoom to the markers for the current place.
    $('li#nav-markers a[data-toggle="tab"]').on('shown.bs.tab', function(e) {
        setMarkersForPlaceId(self.markersData(), self.currentPlaceData().id);

        fitMarkersInsideMap();
    }).extend({
        deferred: true
    });
    // When going to Restaurants-tab, retrieve restaurants.
    $('li#nav-restaurants a[data-toggle="tab"]').on('shown.bs.tab', function(e) {
        var withinMap = map.getBounds().contains(markers[markers.length - 1].getPosition());
        if (self.businesses().length === 0 || !withinMap) {
            self.getYelp();
        } else {
            if (self.currentMarkers() !== self.businesses()) {
                self.currentMarkers(self.businesses());
            }
        }
    });
    // When expanding a restaurant-item in the menu, only then do we load the image to that restaurant.
    $('div.panel-group').on('show.bs.collapse', function(event) {
        target = $(event.target);
        img = target.find('.dontload');
        img.attr('src', img.attr('url'));
        img.removeClass('hidden');
        img.removeClass('dontload');
        // Scroll to this item
        var scrollTo = target.parent().offset().top + $('aside').scrollTop() - $('aside').offset().top;
        $('aside').animate({
            scrollTop: scrollTo,
        }, 500);

    });

    // Expand an item
    self.expandItem = function(item, event) {
        var targets = $(event.target).parent().find('.expandable');
        targets.toggleClass('hidden');
    };

    // Show and animate the menu.
    self.showMenu = function() {
        var a = $('aside');
        var m = $('main');
        if (a.is(':visible')) {
            m.css({
                'margin-left': a.width()
            });
            m.animate({
                'margin-left': 0
            }, 500);
            a.animate({
                left: -a.width(),
            }, 500, function() {
                a.hide();
            });
        } else {
            m.animate({
                'margin-left': a.width()
            }, 500);
            a.show();
            a.animate({
                left: 0
            }, 500);

        }
        a.removeClass('visible-lg');
        a.removeClass('visible-md');
    };
    //*********** GOOGLE MAPS ***************///
    // Center the map on a location whenever currentPlaceData changes
    self.centerMap = ko.computed(function() {
        if (self.google() && self.currentPlaceData()) {
            var place = self.currentPlaceData();
            map.setCenter({
                lat: place.coordinates.latitude,
                lng: place.coordinates.longitude
            });
            map.setZoom(place.zoom);
        }
    });
    // Place markers on map whenever markers changes
    ko.computed(function() {
        self.currentPlaceData();
        var m = self.currentMarkers();
        if (self.google() && m.length > 0) {
            deleteMarkers();
            for (var i = 0; i < m.length; i++) {
                var thisMarker = m[i];
                thisMarker.position = {
                    lat: thisMarker.coordinates.latitude,
                    lng: thisMarker.coordinates.longitude
                };
                thisMarker.map = map;
                thisMarker.animation = google.maps.Animation.DROP;
                var marker = new google.maps.Marker(thisMarker);

                // Push the marker to our array of markers.
                markers.push(marker);
                // Create an onclick event to open an infowindow at each marker.
                marker.addListener('click', function() { // jshint ignore:line
                    populateInfoWindow(this, largeInfowindow);
                });
                // showListings()
            }
        }
    });
    self.popInfoWindow = function(markerData) {
        // When clicking an item in the menu that is on a different location,
        // jump to that location
        if (this.place_id != self.currentPlaceData().id) {
            for (var i = 0; i < self.placesData().length; i++) {
                thisPlace = self.placesData()[i];
                if (thisPlace.id == this.place_id) {
                    self.changePlace(thisPlace);
                }
            }
        }
        // Open the correct infowindow when click on marker in menu
        for (var j = 0; j < markers.length; j++) {
            var thisMapMarker = markers[j];
            if (thisMapMarker.id === markerData.id) {
                populateInfoWindow(thisMapMarker, largeInfowindow);
            }
        }
    };
}
// Enable tab-clicking in bootstrap
$(document).ready(function() {
    $('[data-toggle=offcanvas]').click(function() {
        $('.row-offcanvas').toggleClass('active');
    });
});
