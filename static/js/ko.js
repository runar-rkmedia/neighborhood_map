var largeInfowindow;

function SidepanelView() {
    // Data
    var self = this;

    self.google = ko.observable(!!window.google);
    self.chosenPlaceId = ko.observable();
    self.currentPlaceData = ko.observable();
    self.showPlacesList = ko.observable();
    self.showMarkersList = ko.observable(true);
    self.placesData = ko.observableArray();
    self.markersData = ko.observableArray();
    self.currentMarkers = ko.observableArray();
    self.markers = ko.observableArray();
    self.userFilter = ko.observable();
    self.errormsg = ko.observable();
    self.loading = ko.observable();
    self.yelp_term = ko.observable();
    self.yelp_sorting = ko.observable('best_match');
    self.businesses = ko.observableArray();

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
    self.visibilityMarkers = ko.computed(function() {
        if (self.filterMarkers() && self.google() && markers.length > 0) {
            for (var i = 0; i < markers.length; i++) {
                this_mark = markers[i];
                var result = $.grep(self.filterMarkers(), function(e) { // jshint ignore:line
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
    // TODO; Add default error-handling
    $.get("/json/")
        .done(function(data) {
            self.placesData(data.places);
            self.markersData(data.markers);
            self.currentMarkers(data.markers);
            self.showPlacesList(true);
            if (!self.currentPlaceData()) {
                self.currentPlaceData(data.places[0]);
            }
        })
        .fail(function(e) {
            self.errormsg('Could not retrieve data: Error ' + e.status);
        });

    // Retrieve restaurants from yelp
    self.getYelp = function(event) {
        var c = map.getCenter();
        var p = self.currentPlaceData();
        var term = "";
        if (self.yelp_term()) {
            term = self.yelp_term();
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
    self.loadingWeather = ko.observable();
    self.currentWeather = ko.observable();
    ko.computed(function() {
        self.loadingWeather(true);
        if (self.google() && self.currentPlaceData()) {
            var c = map.getCenter();
            $.get("http://api.openweathermap.org/data/2.5/weather?lat=" + c.lat() + "&lon=" + c.lng() + "&id=524901&APPID=97e52ac5a6390a6e0693d73682eab2f9")
                .done(function(data) {
                    self.currentWeather(data);
                    self.loadingWeather(false);
                })
                .fail(function(e) {
                    console.log(e);
                    self.loadingWeather(false);
                    self.errormsg('Could not retrieve data: Error ' + e.status);
                });
        }

    });
    // Place markers on map whenever markers changes
    self.putmarkers = ko.computed(function() {
        var m = self.currentMarkers();
        if (self.google() && m.length > 0) {
            clearMarkers();
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
    // Change the current place to what a user selected
    self.changePlace = function(place) {
        if (self.currentPlaceData() !== place) {
            self.currentPlaceData(place);
        }
        // self.showPlacesList(false);
    };
    self.expandItem = function(item, event) {
        var targets = $(event.target).parent().find('.expandable');
        targets.toggleClass('hidden');
    };

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
    self.popInfoWindow = function(markerData) {
        // When clicking an item in the menu that is on a different location,
        // jump to that location
        // console.log(markerData.id);
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
    // self.showMenu()
}

ko.applyBindings(new SidepanelView());
// When expanding a restaurant-item in the menu, only then do we load the image to that restaurant.
$('div.panel-group').on('show.bs.collapse', function(event) {
    target = $(event.target);
    img = target.find('.dontload');
    img.attr('src', img.attr('url'));
    img.removeClass('hidden');
    img.removeClass('dontload');
});

$('li#nav-restaurants a[data-toggle="tab"]').on('shown.bs.tab', function(e) {
    var vm = ko.dataFor(document.body);
    if (vm.businesses().length === 0) {
        vm.getYelp();
    }
});

$(document).ready(function() {
    $('[data-toggle=offcanvas]').click(function() {
        $('.row-offcanvas').toggleClass('active');
    });
});
