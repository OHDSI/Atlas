define([
	'knockout',
	'./CriteriaTypes',
	'./InputTypes/Window',
], function(
	ko,
	CriteriaTypes,
	Window,
){

	class WindowedCriteria {
		constructor(data, conceptSets) {
			this.data = data || {};
			this.Criteria = CriteriaTypes.GetCriteriaFromObject(data.Criteria, conceptSets);
			this.StartWindow = new Window(data.StartWindow);
			this.EndWindow = ko.observable(data.EndWindow && new Window(data.EndWindow));
			this.RestrictVisit = ko.observable(data.RestrictVisit || false);
			this.IgnoreObservationPeriod = ko.observable(data.IgnoreObservationPeriod);
		}
	}

	return WindowedCriteria;

});