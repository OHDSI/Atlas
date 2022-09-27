define(['knockout'],
function(
	ko
){

	function getCriteriaComponent(data) {
		if (data.hasOwnProperty("Person"))
			return "person-criteria";
		else if (data.hasOwnProperty("ConditionOccurrence"))
			return "condition-occurrence-criteria";
		else if (data.hasOwnProperty("ConditionEra"))
			return "condition-era-criteria";
		else if (data.hasOwnProperty("DrugExposure"))
			return "drug-exposure-criteria";
		else if (data.hasOwnProperty("DrugEra"))
			return "drug-era-criteria";
		else if (data.hasOwnProperty("DoseEra"))
			return "dose-era-criteria";
		else if (data.hasOwnProperty("PayerPlanPeriod"))
			return "payer-plan-period-criteria";
		else if (data.hasOwnProperty("ProcedureOccurrence"))
			return "procedure-occurrence-criteria";
		else if (data.hasOwnProperty("VisitOccurrence"))
			return "visit-occurrence-criteria";
		else if (data.hasOwnProperty("VisitDetail"))
			return "visit-detail-criteria";
		else if (data.hasOwnProperty("Observation"))
			return "observation-criteria";
		else if (data.hasOwnProperty("DeviceExposure"))
			return "device-exposure-criteria";
		else if (data.hasOwnProperty("Measurement"))
			return "measurement-criteria";
		else if (data.hasOwnProperty("Specimen"))
			return "specimen-criteria";
		else if (data.hasOwnProperty("ObservationPeriod"))
			return "observation-period-criteria";
		else if (data.hasOwnProperty("Death"))
			return "death-criteria";
		else if (data.hasOwnProperty("LocationRegion"))
			return "location-region-criteria";
		else
			return "unknown-criteria";
	}

	function formatDropDownOption(option) {
		return '<div class="optionText">' + option.text + '</div>' +
			'<div class="optionDescription">' + option.description + '</div>';
	}

	function getConceptSetName (conceptSetId, conceptSetList, defaultName) {
		var selectedConceptSet = conceptSetList().find(function (item) { return item.id == ko.utils.unwrapObservable(conceptSetId)});
		return 	ko.utils.unwrapObservable(selectedConceptSet && selectedConceptSet.name) || defaultName;
	}
	
	return {
		getCriteriaComponent,
		formatDropDownOption,
		getConceptSetName
	};

});