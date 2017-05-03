var map;
var geocoder;
// var maxzoom = 13;

// Create a new blank array for all the listing markers.
var markers = [];

function initMap() {
    // Constructor creates a new map
    map = new google.maps.Map(document.getElementById('map'), {
        mapTypeControl: false
    });
    geocoder = new google.maps.Geocoder;

    map.setCenter({
        lat: 41.875993,
        lng: 12.3822245
    });
    map.setZoom(11);
    largeInfowindow = new google.maps.InfoWindow();
    var vm = ko.dataFor(document.body);
    vm.google(!!window.google);
}

// This function populates the infowindow when the marker is clicked. We'll only allow
// one infowindow which will open at the marker that is clicked, and populate based
// on that markers position.
function populateInfoWindow(marker, infowindow) {
    // Check to make sure the infowindow is not already opened on this marker.
    c = $('#collapse' + marker.id);
    c.collapse('show');
    if (infowindow.marker != marker) {
        infowindow.marker = marker;
        content = '<h4 class="marker-title">' + marker.name + '</h4>';
        if (marker.description) {
            content += '<div class="marker-description">' + marker.description + '</div>';
        }
        if (marker.location) {
            content += '<div class="marker-address">' + marker.location.address1 + '<br>' + marker.location.address2 + '<br>' + marker.location.address3 + '</div>';
        }
        // if (marker.image_url) {
        //     content += '<img class="marker-image img-responsive" src="' + marker.image_url + '" alt="' + marker.name + '">';
        // }
        infowindow.setContent(content);
        infowindow.open(map, marker);
        // Make sure the marker property is cleared if the infowindow is closed.
        infowindow.addListener('closeclick', function() {
            infowindow.marker = null;
        });
    } else {
        // Close if user pressed marker again
        infowindow.close();
        infowindow.marker = null;
    }
}
// Sets the map on all markers in the array.
function setMapOnAll(map) {
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(map);
    }
}
// Removes the markers from the map, but keeps them in the array.
function clearMarkers() {
    setMapOnAll(null);
}
// Deletes all markers in the array by removing references to them.
function deleteMarkers() {
    clearMarkers();
    markers = [];
}
