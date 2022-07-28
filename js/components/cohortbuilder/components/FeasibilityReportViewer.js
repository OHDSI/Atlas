define([
  "knockout",
  "jquery",
  "text!./FeasibilityReportViewerTemplate.html",
  "./FeasibilityIntersectReport",
  "./FeasibilityAttritionReport",
  "css!../css/report.css",
], function (ko, $, template) {
  function FeasibilityReportViewer(params) {
    var self = this;
    self.report = params.report;
    self.reportType = params.reportType;
    self.reportCaption = params.reportCaption;
    self.selectedView = ko.observable("intersect");

    if (params.viewerWidget) {
      viewerWidget(self);
    }
  }

  var component = {
    viewModel: FeasibilityReportViewer,
    template: template,
  };

  ko.components.register("feasibility-report-viewer", component);

  // return compoonent definition
  return component;
});
