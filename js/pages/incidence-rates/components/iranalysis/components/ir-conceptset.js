define([
	'knockout',
	'text!./ir-conceptset.html',
	'components/Component',
	'utils/AutoBind',
	'utils/CommonUtils',
	'services/IRAnalysis',
	'atlas-state',
	'components/conceptset/conceptset-list'
],function(
	ko,
	view,
	Component,
	AutoBind,
	commonUtils,
	irService,
	sharedState,
){

	class IncidenceRatesConceptSet extends AutoBind(Component) {

		constructor(params) {
			super(params);
      this.data = params.data;
			this.canEdit = params.canEdit || (() => false);
			this.irAnalysisId = params.irAnalysisId;
			this.conceptSets = ko.computed(() => this.data() && this.data().conceptSets);
			this.conceptSetStore = params.conceptSetStore;
		}

		exportConceptSets() {
			irService.exportConceptSets(ko.unwrap(this.irAnalysisId));
		}
	}

	return commonUtils.build('incidence-rates-conceptset', IncidenceRatesConceptSet, view);

});