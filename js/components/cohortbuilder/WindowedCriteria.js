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
		constructor(data = {}, conceptSets) {
			this.Criteria = CriteriaTypes.GetCriteriaFromObject(data.Criteria, conceptSets);
			this.StartWindow = new Window(data.StartWindow);

			// for backwards compatability, if the data.EndWindow is populated, but useEventEnd is null, set useEventEnd = true
			const endWindowData = data.EndWindow;
			if (endWindowData && !endWindowData.hasOwnProperty("UseEventEnd")) {
				endWindowData.UseEventEnd = true;
			}

			this.EndWindow = ko.observable(data.EndWindow && new Window(data.EndWindow));
			this.RestrictVisit = ko.observable(data.RestrictVisit || false);
			this.IgnoreObservationPeriod = ko.observable(data.IgnoreObservationPeriod || false);
		}
	}

	return WindowedCriteria;

});