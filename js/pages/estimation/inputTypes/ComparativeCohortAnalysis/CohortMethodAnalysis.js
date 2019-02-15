define([
    'knockout',
    '../Analysis',
    './GetDbCohortMethodDataArgs',
    './CreateStudyPopulationArgs',
    './CreatePsArgs',
    './TrimByPsArgs',
    './TrimByPsToEquipoiseArgs',
    './MatchOnPsArgs',
    './MatchOnPsAndCovariateArgs',
    './StratifyByPsArgs',
    './StratifyByPsAndCovariatesArgs',
    './FitOutcomeModelArgs'
 ], function (
    ko,
    Analysis,
    GetDbCohortMethodDataArgs,
    CreateStudyPopulationArgs,
    CreatePsArgs,
    TrimByPsArgs,
    TrimByPsToEquipoiseArgs,
    MatchOnPsArgs,
    MatchOnPsAndCovariatesArgs,
    StratifyByPsArgs,
    StratifyByPsAndCovariatesArgs,
    FitOutcomeModelArgs
 ) {
	class CohortMethodAnalysis extends Analysis {
        constructor(data = {}, defaultCovariateSettings) {
            data.attr_class = "cmAnalysis"; 
            super(data);
            this.targetType = ko.observable(data.targetType || null);
            this.comparatorType = ko.observable(data.comparatorType || null);
            this.getDbCohortMethodDataArgs = new GetDbCohortMethodDataArgs(data.getDbCohortMethodDataArgs, defaultCovariateSettings);
            this.createStudyPopArgs = new CreateStudyPopulationArgs(data.createStudyPopArgs);
            this.createPs = ko.observable(data.createPs === undefined ? true : data.createPs);
            this.createPsArgs = new CreatePsArgs(data.createPsArgs);
            this.trimByPs = ko.observable(data.trimByPs === undefined ? false : data.trimByPs);
            this.trimByPsArgs = new TrimByPsArgs(data.trimByPsArgs);
            this.trimByPsToEquipoise = ko.observable(data.trimByPsToEquipoise === undefined ? false : data.trimByPsToEquipoise);
            this.trimByPsToEquipoiseArgs = new TrimByPsToEquipoiseArgs(data.trimByPsToEquipoiseArgs);
            this.matchOnPs = ko.observable(data.matchOnPs === undefined ? false : data.matchOnPs);
            this.matchOnPsArgs = new MatchOnPsArgs(data.matchOnPsArgs);
            this.matchOnPsAndCovariates = ko.observable(data.matchOnPsAndCovariates === undefined ? false : data.matchOnPsAndCovariates);
            this.matchOnPsAndCovariatesArgs = new MatchOnPsAndCovariatesArgs(data.matchOnPsAndCovariatesArgs);
            this.stratifyByPs = ko.observable(data.stratifyByPs === undefined ? true : data.stratifyByPs);
            this.stratifyByPsArgs = new StratifyByPsArgs(data.stratifyByPsArgs);
            this.stratifyByPsAndCovariates = ko.observable(data.stratifyByPsAndCovariates === undefined ? false : data.stratifyByPsAndCovariates);
            this.stratifyByPsAndCovariatesArgs = new StratifyByPsAndCovariatesArgs(data.stratifyByPsAndCovariatesArgs);
            this.fitOutcomeModel = ko.observable(data.fitOutcomeModel === undefined ? true : data.fitOutcomeModel);
            this.fitOutcomeModelArgs = new FitOutcomeModelArgs(data.fitOutcomeModelArgs);
        }
	}
	
	return CohortMethodAnalysis;
});