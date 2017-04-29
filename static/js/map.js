var map;
// var maxzoom = 13;

// Create a new blank array for all the listing markers.
var markers = [];

function initMap() {
    // Constructor creates a new map
    map = new google.maps.Map(document.getElementById('map'), {
        mapTypeControl: false
    });

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
    if (infowindow.marker != marker) {
        infowindow.marker = marker;
        infowindow.setContent('<h4 class="marker-title">' + marker.title + '</h4><div class="marker-description">' + marker.description + '</div>');
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
