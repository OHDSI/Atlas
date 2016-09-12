define(function (require, exports) {
	
	var ko = require('knockout')
	
	var irAnalysisEditor = require('./components/editor');
	ko.components.register('ir-analysis-editor', irAnalysisEditor);
	
	var irAnalysisBrowser = require('./components/browser');
	ko.components.register('ir-analysis-browser', irAnalysisBrowser);

	var irAnalysisResults = require('./components/results');
	ko.components.register('ir-analysis-results', irAnalysisResults);

	var irAnalysisReport = require('./components/report');
	ko.components.register('ir-analysis-report', irAnalysisReport);
	
});
