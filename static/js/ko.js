function SidepanelView() {
    // Data
    var self = this;

    self.google = ko.observable(!!window.google);
    self.chosenPlaceId = ko.observable();
    self.chosenPlaceData = ko.observable();
    self.places = ko.observableArray();
    $.get("/json/places/",function (data) {
        self.places(data.places);
        if (!self.chosenPlaceData()) {
            self.chosenPlaceData(data.places[1]);
        }
    });

    self.centerMap = ko.computed(function () {
        if (self.google() && self.chosenPlaceData()) {
            var place = self.chosenPlaceData();
            map.setCenter({lat: place.latitude, lng: place.longitude});
            map.setZoom(place.zoom);
        }
    });
    self.changePlace = function (place) {
        self.chosenPlaceData(place);
    };
}

ko.applyBindings(new SidepanelView());
