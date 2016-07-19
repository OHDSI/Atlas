define(function (require, exports) {
	
	var ko = require('knockout')
	
	var expressionViewer = require('./components/CohortExpressionViewer');
	ko.components.register('cohort-expression-viewer', expressionViewer);
	
	var criteriaGroup = require('./components/CriteriaGroup');
	ko.components.register('criteria-group-viewer', criteriaGroup);

	var conditionOccurrence = require('./components/ConditionOccurrence');
	ko.components.register('condition-occurrence-criteria-viewer', conditionOccurrence);

	var conditionEra = require('./components/ConditionEra');
	ko.components.register('condition-era-criteria-viewer', conditionEra);

	var drugExposure = require('./components/DrugExposure');
	ko.components.register('drug-exposure-criteria-viewer', drugExposure);

	var drugEra = require('./components/DrugEra');
	ko.components.register('drug-era-criteria-viewer', drugEra);	
	
	var doseEra = require('./components/DoseEra');
	ko.components.register('dose-era-criteria-viewer', doseEra);
	
	var procedureOccurrence = require('./components/ProcedureOccurrence');
	ko.components.register('procedure-occurrence-criteria-viewer', procedureOccurrence);
	
	var observation = require('./components/Observation');
	ko.components.register('observation-criteria-viewer', observation);
	
	var visitOccurrence = require('./components/VisitOccurrence');
	ko.components.register('visit-occurrence-criteria-viewer', visitOccurrence);
	
	var deviceExposure = require('./components/DeviceExposure');
	ko.components.register('device-exposure-criteria-viewer', deviceExposure);

	var measurement = require('./components/Measurement');
	ko.components.register('measurement-criteria-viewer', measurement);

	var observationPeriod = require('./components/ObservationPeriod');
	ko.components.register('observation-period-criteria-viewer', observationPeriod);

	var specimen = require('./components/Specimen');
	ko.components.register('specimen-criteria-viewer', specimen);
	
	var death = require('./components/Death');
	ko.components.register('death-criteria-viewer', death);
	
	var numericRange = require('./components/NumericRange');
	ko.components.register('numeric-range-viewer', numericRange);

	var dateRange = require('./components/DateRange');
	ko.components.register('date-range-viewer', dateRange);
	
	var windowInput = require('./components/WindowInput');
	ko.components.register('window-input-viewer',windowInput);
	
	var textFilter = require('./components/TextFilter');
	ko.components.register('text-filter-viewer',textFilter);	
	
	var conceptList = require('./components/ConceptList');
	ko.components.register('concept-list-viewer',conceptList);
	
	var conceptSetReference = require('./components/ConceptSetReference');
	ko.components.register('conceptset-reference',conceptSetReference);
	
	var conceptSetViewer = require('./components/ConceptSetViewer');
	ko.components.register('conceptset-viewer',conceptSetViewer);

});
