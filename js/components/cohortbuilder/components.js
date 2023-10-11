define(function (require, exports) {
	
	var ko = require('knockout')
	
	var expressionEditor = require('./components/CohortExpressionEditor');
	ko.components.register('cohort-expression-editor', expressionEditor);

	var initialCriteriaEditor = require('./components/InitialCriteriaEditor');
	ko.components.register('initial-criteria-editor', initialCriteriaEditor);

	var censoringCriteriaEditor = require('./components/CensoringCriteriaEditor');
	ko.components.register('censoring-criteria-editor', censoringCriteriaEditor);
	
	var inclusionEditor = require('./components/InclusionRuleEditor');
	ko.components.register('inclusion-rule-editor', inclusionEditor);
	
	var criteriaGroup = require('./components/CriteriaGroup');
	ko.components.register('criteria-group', criteriaGroup);

	var conditionOccurrence = require('./components/ConditionOccurrence');
	ko.components.register('condition-occurrence-criteria', conditionOccurrence);

	var conditionEra = require('./components/ConditionEra');
	ko.components.register('condition-era-criteria', conditionEra);

	var drugExposure = require('./components/DrugExposure');
	ko.components.register('drug-exposure-criteria', drugExposure);

	var drugEra = require('./components/DrugEra');
	ko.components.register('drug-era-criteria', drugEra);	
	
	var doseEra = require('./components/DoseEra');
	ko.components.register('dose-era-criteria', doseEra);
	
	var procedureOccurrence = require('./components/ProcedureOccurrence');
	ko.components.register('procedure-occurrence-criteria', procedureOccurrence);
	
	var observation = require('./components/Observation');
	ko.components.register('observation-criteria', observation);
	
	var visitOccurrence = require('./components/VisitOccurrence');
	ko.components.register('visit-occurrence-criteria', visitOccurrence);

	var visitDetail = require('./components/VisitDetail');
	ko.components.register('visit-detail-criteria', visitDetail);
	
	var deviceExposure = require('./components/DeviceExposure');
	ko.components.register('device-exposure-criteria', deviceExposure);

	var measurement = require('./components/Measurement');
	ko.components.register('measurement-criteria', measurement);

	var observationPeriod = require('./components/ObservationPeriod');
	ko.components.register('observation-period-criteria', observationPeriod);

	var specimen = require('./components/Specimen');
	ko.components.register('specimen-criteria', specimen);
	
	var death = require('./components/Death');
	ko.components.register('death-criteria', death);

	var demographicCriteria = require('./components/DemographicCriteria');
	ko.components.register('demographic-criteria', demographicCriteria);
	
	var numericRange = require('./components/NumericRange');
	ko.components.register('numeric-range', numericRange);

	var dateRange = require('./components/DateRange');
	ko.components.register('date-range', dateRange);
	
	var dateAdjustment = require('./components/DateAdjustment');
	ko.components.register('date-adjustment', dateAdjustment);

	var windowInput = require('./components/WindowInput');
	ko.components.register('window-input',windowInput);
	
	var textFilter = require('./components/TextFilter');
	ko.components.register('text-filter-input',textFilter);	
	
	var periodInput = require('./components/Period');
	ko.components.register('period-input',periodInput);

	var cycleToggleInput = require('./components/CycleToggleInput');
	ko.components.register('cycle-toggle-input', cycleToggleInput);

	var conceptList = require('./components/ConceptList');
	ko.components.register('concept-list',conceptList);
	
	var endStrategyEditor = require('./components/EndStrategyEditor');
	ko.components.register('end-strategy-editor', endStrategyEditor);

	var conceptSetPreview = require('./components/ConceptSetQuickview');
	ko.components.register('conceptset-quickview', conceptSetPreview);
	
	var payerPlanPeriod = require('./components/PayerPlanPeriod');
	ko.components.register('payer-plan-period-criteria', payerPlanPeriod);

	var locationRegion = require('./components/LocationRegion');
	ko.components.register('location-region-criteria', locationRegion);

	require('./components/WindowedCriteria');
	
});
