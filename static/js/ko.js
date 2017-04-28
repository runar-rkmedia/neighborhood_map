function SidepanelView() {
    // Data
    var self = this;

    self.google = ko.observable(!!window.google);
    self.chosenPlaceId = ko.observable();
    self.chosenPlaceData = ko.observable();
    $.get("/json/places/",self.chosenPlaceData);

    self.centerMap = ko.computed(function () {
        if (self.google() && self.chosenPlaceData()) {
            console.log('loaded ');
            var place = self.chosenPlaceData().places[0];
            map.setCenter({lat: place.latitude, lng: place.longitude});
            map.setZoom(place.zoom);
        }
    });
}

ko.applyBindings(new SidepanelView());
