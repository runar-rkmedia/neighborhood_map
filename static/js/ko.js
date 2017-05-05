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

    // User-input
    self.yelp_term = ko.observable();
    self.yelp_sorting = ko.observable('best_match');
    self.userFilter = ko.observable();

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
            if (self.currentPlaceData()) {
                return ko.utils.arrayFilter(self.markersData(), function(marker) {
                    return marker.place_id == self.currentPlaceData().id;
                });
            }
            return self.markers();
        } else {
            return ko.utils.arrayFilter(self.markersData(), function(marker) {
                return marker.name.toLowerCase().indexOf(self.userFilter().toLowerCase()) != -1;
            });
        }
    });
    // Filter businesses on search
    self.filterBusinesses = ko.computed(function() {
        if (!self.yelp_term() || self.lastYelpSearch == self.yelp_term()) {
            return self.businesses();
        } else {
            return ko.utils.arrayFilter(self.businesses(), function(business) {
                return business.name.toLowerCase().indexOf(self.yelp_term().toLowerCase()) != -1;
            });
        }
    });
    // Filter-text for marker
    self.filterdesc = ko.computed(function() {
        if (self.currentPlaceData()) {
            if (!self.userFilter()) {
                return 'Listing all markers close to ' + self.currentPlaceData().name;
            } else {
                return 'Listing all markers matching the name "' + self.userFilter() + '"';
            }
        }
    });
    // Filter the visibility of markers on screen
    ko.computed(function() {
        var f = self.filterMarkers().concat(self.filterBusinesses());
        if (f && self.google() && markers.length > 0) {
            for (var i = 0; i < markers.length; i++) {
                this_mark = markers[i];
                var result = $.grep(f, function(e) { // jshint ignore:line
                    return e.id == this_mark.id;
                });
                if (result.length > 0) {
                    this_mark.setVisible(true);
                } else {
                    this_mark.setVisible(false);
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
            setMarkersForPlace_id(self.markersData(),self.currentPlaceData().id);
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
        if (self.yelp_term()) {
            term = self.yelp_term();
            lastYelpSearch = term;
        }
        if (p && c) {
            self.loading(true);
            $.post("/json/yelp/", {
                    'latitude': c.lat(),
                    'longitude': c.lng(),
                    'term': term,
                    'sort_by': self.yelp_sorting,
                })
                .done(function(data) {
                    self.loading(false);
                    self.businesses(data.businesses);
                    self.currentMarkers(data.businesses);
                });
        }
    };

    // Retrieve weather-data
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
            var index = key_val_in_array(self.knownGeolocations(), location);
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
                        window.alert('Geocoder failed due to: ' + status);
                    }
                });
            } else {
                self.currentGeoName(self.knownGeolocations()[index].geoinfo[1].formatted_address);
            }
        }
    }).extend({
        deferred: true
    });
    ko.computed(function () {
        if(self.currentWeather()){
            skycons.set("icon1", self.currentWeather().currently.icon);
            skycons.play();
        }
    });

    // Helper for matching a location-object inside an array of obhjects.
    function key_val_in_array(array, location_object) {
        for (var i = 0; i < array.length; i++) {
            var thisData = array[i];
            if (thisData.location.lat == location_object.lat && thisData.location.lng == location_object.lng) {
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
    function setMarkersForPlace_id(markers, place_id) {
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
            setMarkersForPlace_id(self.markersData(),self.currentPlaceData().id);
        }
    };

    //*********** BOOTSTRAP ***************//
    // When going to the Markers-tab, zoom to the markers for the current place.
    $('li#nav-markers a[data-toggle="tab"]').on('shown.bs.tab', function(e) {
        setMarkersForPlace_id(self.markersData(),self.currentPlaceData().id);

        fitMarkersInsideMap();
    }).extend({
        deferred: true
    });
    // When going to Restaurants-tab, retrieve restaurants.
    $('li#nav-restaurants a[data-toggle="tab"]').on('shown.bs.tab', function(e) {
        var within_map = map.getBounds().contains(markers[markers.length - 1].getPosition());
        if (self.businesses().length === 0 || !within_map) {
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
                var this_marker = m[i];
                this_marker.position = {
                    lat: this_marker.coordinates.latitude,
                    lng: this_marker.coordinates.longitude
                };
                this_marker.map = map;
                this_marker.animation = google.maps.Animation.DROP;
                var marker = new google.maps.Marker(this_marker);

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
            this_map_marker = markers[j];
            if (this_map_marker.id === markerData.id) {
                populateInfoWindow(this_map_marker, largeInfowindow);
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
