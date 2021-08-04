define([
  "knockout",
  "text!./InclusionRuleEditorTemplate.html",
  "components/cohortbuilder/components/CriteriaGroup",
  "ko.sortable",
], function (ko, template) {
  function InclusionRuleEditor(params) {
    var self = this;
    self.InclusionRule = params.InclusionRule;
    self.IndexRule = params.IndexRule;
  }

  var component = {
    viewModel: InclusionRuleEditor,
    template: template,
  };

  // return component definition
  return component;
});
