function SidepanelView() {
    // Data
    var self = this;
    self.chosenPlaceId = ko.observable();
    self.chosenPlaceData = ko.observable();
    $.get("/json/places/",self.chosenPlaceData);
}

ko.applyBindings(new SidepanelView());
