define([
	'knockout',
	'text!./fa-conceptset.html',
	'components/Component',
	'utils/AutoBind',
	'utils/CommonUtils',
	'../../../services/FeatureAnalysisService',
	'components/conceptset/conceptset-list'
],function(
	ko,
	view,
	Component,
	AutoBind,
	commonUtils,
	faService,
){

	class FeatureAnalysisConceptSet extends AutoBind(Component) {

		constructor(params) {
			super(params);
			this.data = params.data;
			this.canEdit = params.canEdit || (() => false);
			this.featureId = params.featureId;
			this.conceptSets = ko.computed(() => this.data() && this.data().conceptSets);
		}

		exportConceptSets() {
			faService.exportConceptSets(ko.unwrap(this.featureId));
		}
	}

	return commonUtils.build('feature-analysis-conceptset', FeatureAnalysisConceptSet, view);

});