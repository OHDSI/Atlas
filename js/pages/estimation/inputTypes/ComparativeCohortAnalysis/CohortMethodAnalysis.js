define(function (require, exports) {
    var ko = require('knockout');
   var GetDbCohortMethodDataArgs = require('./GetDbCohortMethodDataArgs');
   var CreateStudyPopulationArgs = require('./CreateStudyPopulationArgs');
   var CreatePsArgs = require('./CreatePsArgs');
   var TrimByPsArgs = require('./TrimByPsArgs');
   var TrimByPsToEquipoiseArgs = require('./TrimByPsToEquipoiseArgs');
   var MatchOnPsArgs = require('./MatchOnPsArgs');
   var MatchOnPsAndCovariatesArgs = require('./MatchOnPsAndCovariateArgs');
   var StratifyByPsArgs = require('./StratifyByPsArgs');
   var StratifyByPsAndCovariatesArgs = require('./StratifyByPsAndCovariatesArgs');
   var FitOutcomeModelArgs = require('./FitOutcomeModelArgs');
   
	function CohortMethodAnalysis(data, defaultCovariateSettings) {
		var self = this;
        data = data || {};
        
        self.analysisId = ko.observable(data.analysisId || null);
        self.description = ko.observable(data.description || null);
        self.targetType = ko.observable(data.targetType || null);
        self.comparatorType = ko.observable(data.comparatorType || null);
        self.getDbCohortMethodDataArgs = new GetDbCohortMethodDataArgs(data.getDbCohortMethodDataArgs, defaultCovariateSettings);
        self.createStudyPopArgs = new CreateStudyPopulationArgs(data.createStudyPopArgs);
        self.createPs = ko.observable(data.createPs === undefined ? true : data.createPs);
        self.createPsArgs = new CreatePsArgs(data.createPsArgs);
        self.trimByPs = ko.observable(data.trimByPs === undefined ? false : data.trimByPs);
        self.trimByPsArgs = new TrimByPsArgs(data.trimByPsArgs);
        self.trimByPsToEquipoise = ko.observable(data.trimByPsToEquipoise === undefined ? false : data.trimByPsToEquipoise);
        self.trimByPsToEquipoiseArgs = new TrimByPsToEquipoiseArgs(data.trimByPsToEquipoiseArgs);
        self.matchOnPs = ko.observable(data.matchOnPs === undefined ? false : data.matchOnPs);
        self.matchOnPsArgs = new MatchOnPsArgs(data.matchOnPsArgs);
        self.matchOnPsAndCovariates = ko.observable(data.matchOnPsAndCovariates === undefined ? false : data.matchOnPsAndCovariates);
        self.matchOnPsAndCovariatesArgs = new MatchOnPsAndCovariatesArgs(data.matchOnPsAndCovariatesArgs);
        self.stratifyByPs = ko.observable(data.stratifyByPs === undefined ? true : data.stratifyByPs);
        self.stratifyByPsArgs = new StratifyByPsArgs(data.stratifyByPsArgs);
        self.stratifyByPsAndCovariates = ko.observable(data.stratifyByPsAndCovariates === undefined ? false : data.stratifyByPsAndCovariates);
        self.stratifyByPsAndCovariatesArgs = new StratifyByPsAndCovariatesArgs(data.stratifyByPsAndCovariatesArgs);
        self.fitOutcomeModel = ko.observable(data.fitOutcomeModel === undefined ? true : data.fitOutcomeModel);
        self.fitOutcomeModelArgs = new FitOutcomeModelArgs(data.fitOutcomeModelArgs);
        self.attr_class = data.attr_class || "cmAnalysis";
	}
	
	return CohortMethodAnalysis;
});