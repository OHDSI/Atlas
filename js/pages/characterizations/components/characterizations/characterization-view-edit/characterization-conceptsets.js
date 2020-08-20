define([
	'knockout',
	'text!./characterization-conceptsets.html',
	'components/Component',
	'utils/AutoBind',
	'utils/CommonUtils',
	'../../../services/CharacterizationService',
	'components/conceptset/conceptset-list',
],function(
	ko,
	view,
	Component,
	AutoBind,
	commonUtils,
	characterizationService,
){

	class CharacterizationConceptSet extends AutoBind(Component){
		constructor(params) {
			super(params);
			this.conceptSets = params.conceptSets;
			this.conceptSetStore = params.conceptSetStore;
			this.canEdit = params.canEdit || (() => false);
			this.characterizationId = params.characterizationId;
		}

		exportConceptSets() {
			characterizationService.exportConceptSets(ko.unwrap(this.characterizationId));
		}
	}

	return commonUtils.build('characterization-conceptsets', CharacterizationConceptSet, view);
});