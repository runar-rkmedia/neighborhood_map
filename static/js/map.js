var map;
// var maxzoom = 13;

// Create a new blank array for all the listing markers.
var markers = [];

function initMap() {
    // Constructor creates a new map - only center and zoom are required.
    map = new google.maps.Map(document.getElementById('map'), {
        mapTypeControl: false
    });

    // These are the real estate listings that will be shown to the user.
    // Normally we'd have these in a database instead.
    var locations = [{
        title: 'Basilica di San Giovanni in Laterano',
        location: {
            lat: 41.8788536,
            lng: 12.444407
        }
    }, ];

    // Constructor creates a new map - only center and zoom are required.
    map.setCenter({
        lat: 41.875993,
        lng: 12.3822245
    });
    map.setZoom(11);
    var vm = ko.dataFor(document.body);
    vm.google(!!window.google);

//     map.initialZoom = true;
//
//     google.maps.event.addListener(map, 'zoom_changed', function() {
//     zoomChangeBoundsListener =
//         google.maps.event.addListener(map, 'bounds_changed', function(event) {
//             if (this.getZoom() > maxzoom && this.initialZoom === true) {
//                 // Change max/min zoom here
//                 // this.setZoom(maxzoom);
//                 this.initialZoom = false;
//             }
//         google.maps.event.removeListener(zoomChangeBoundsListener);
//     });
// });
}

// This function populates the infowindow when the marker is clicked. We'll only allow
// one infowindow which will open at the marker that is clicked, and populate based
// on that markers position.
function populateInfoWindow(marker, infowindow) {
    // Check to make sure the infowindow is not already opened on this marker.
    if (infowindow.marker != marker) {
        infowindow.marker = marker;
        infowindow.setContent('<h4 class="marker-title">' + marker.title + '</h4><div class="marker-description">' + marker.description + '</div>');
        infowindow.open(map, marker);
        // Make sure the marker property is cleared if the infowindow is closed.
        infowindow.addListener('closeclick', function() {
            infowindow.marker = null;
        });
    }
}

// This function will loop through the markers array and display them all.
function showListings() {
    var bounds = new google.maps.LatLngBounds();
    // Extend the boundaries of the map for each marker and display the marker
    for (var i = 0; i < markers.length; i++) {
        // markers[i].setMap(map);
        bounds.extend(markers[i].position);
    }
    // Also extend the boundaries to the center of current place, so that we can see that too.
    bounds.extend(map.getCenter());

    map.fitBounds(bounds);
}

// This function will loop through the listings and hide them all.
function hideListings() {
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(null);
    }
}
