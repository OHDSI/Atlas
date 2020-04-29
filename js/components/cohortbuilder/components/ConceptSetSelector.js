define([
  "knockout",
  "text!./ConceptSetSelectorTemplate.html",
  "databindings/cohortbuilder/dropupBinding",
  "databindings",
], function (ko, template) {
  function conceptSetSorter(a, b) {
    var textA = a.name().toUpperCase();
    var textB = b.name().toUpperCase();
    return textA < textB ? -1 : textA > textB ? 1 : 0;
  }

  function conceptsetSelector(params) {
    var self = this;
    self.conceptSetId = params.conceptSetId;
    self.defaultText = params.defaultText;
    self.conceptSets = params.conceptSets;
    self.filterText = ko.observable("");
    self.previewVisible = ko.observable(false);
    self.previewTop = ko.observable(0);
    self.previewLeft = ko.observable(0);

    self.previewConceptSet = ko.observable();

    self.sortedConceptSets = self.conceptSets.extend({
      sorted: conceptSetSorter,
    });
    self.filteredConceptSets = ko.computed(function () {
      var selectedConceptSet = self.conceptSets().filter(function (item) {
        return item.id == self.conceptSetId();
      });
      var filterText = self.filterText().toLowerCase();
      return [
        ...selectedConceptSet,
        ...self
          .sortedConceptSets()
          .filter(
            (cs) =>
              cs.name().toLowerCase().match(filterText) &&
              cs.id !== (selectedConceptSet[0] && selectedConceptSet[0].id)
          ),
      ];
    });
    self.conceptSetName = ko.computed(function () {
      var selectedConceptSet = self.conceptSets().filter(function (item) {
        return item.id == self.conceptSetId();
      });
      return (
        (selectedConceptSet.length > 0 && selectedConceptSet[0].name()) ||
        ko.unwrap(self.defaultText)
      );
    });

    self.itemClicked = function (item) {
      self.conceptSetId(item.id);
      self.previewVisible(false);
    };

    self.showConceptSetPreview = function (item, context, event) {
      var menuElement = $(event.currentTarget).closest("ul");
      var position = menuElement.position();
      self.previewConceptSet(item);
      self.previewTop(position.top);
      self.previewLeft(position.left + menuElement.width() + 10);
      self.previewVisible(true);
    };

    self.hideConceptSetPreview = function (item, context, event) {
      self.previewVisible(false);
    };

    self.clear = function () {
      self.conceptSetId(null);
    };
  }

  var component = {
    viewModel: conceptsetSelector,
    template: template,
  };

  ko.components.register("conceptset-selector", component);
  return component;
});
