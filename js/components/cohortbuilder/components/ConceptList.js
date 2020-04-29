define([
  "knockout",
  "text!./ConceptListTemplate.html",
  "conceptpicker/InputTypes/Concept",
], function (ko, template, Concept) {
  function CocneptListViewModel(params) {
    var self = this;
    self.ConceptList = ko.utils.unwrapObservable(params.$raw.ConceptList);
    self.PickerParams = params.PickerParams;

    // onAdd handler
    self.addConcepts = function (concepts) {
      // remove only add new concepts.
      var ixConcepts = {};
      self.ConceptList().forEach(function (item) {
        ixConcepts[item.CONCEPT_ID] = true;
      });

      var importedConcepts = [];
      concepts.forEach(function (item) {
        if (!ixConcepts[item.CONCEPT_ID]) importedConcepts.push(item);
      });

      self.ConceptList(self.ConceptList().concat(importedConcepts));
    };

    self.removeConcept = function (item) {
      this.ConceptList.remove(item);
    };
  }

  // return compoonent definition
  return {
    viewModel: CocneptListViewModel,
    template: template,
  };
});
