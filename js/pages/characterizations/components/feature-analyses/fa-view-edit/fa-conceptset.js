define([
	'knockout',
	'text!./fa-conceptset.html',
	'components/Component',
	'utils/AutoBind',
	'utils/CommonUtils',
	'../../../services/FeatureAnalysisService',
	'atlas-state',
	'components/conceptset/conceptset-list'
],function(
	ko,
	view,
	Component,
	AutoBind,
	commonUtils,
	faService,
	sharedState,
){

	class FeatureAnalysisConceptSet extends AutoBind(Component) {

		constructor(params) {
			super(params);
			this.data = params.data;
			this.canEdit = params.canEdit || (() => false);
			this.featureId = params.featureId;
      this.conceptSetStore = params.conceptSetStore;
			this.conceptSets = ko.pureComputed(() => this.data() && this.data().conceptSets);
		}

		exportConceptSets() {
			faService.exportConceptSets(ko.unwrap(this.featureId));
		}
	}

	return commonUtils.build('feature-analysis-conceptset', FeatureAnalysisConceptSet, view);

});