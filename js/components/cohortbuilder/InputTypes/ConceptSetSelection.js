define(['knockout'], function (ko) {

    function ConceptSetSelection(data) {
        var self = this;
        data = data || {};

        self.IsExclusion = ko.observable(data.IsExclusion ? true : data.IsExclusion || null);
        self.CodesetId = ko.observable(data.CodesetId ? data.CodesetId : null);
    }

    return ConceptSetSelection;
});