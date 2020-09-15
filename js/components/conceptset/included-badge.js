define([
	'knockout',
	'text!./included-badge.html',
	'components/Component',
	'utils/CommonUtils',
	'components/conceptsetInclusionCount/conceptsetInclusionCount',
], function(
	ko,
	view,
	Component,
	commonUtils,
){

	class IncludedBadge extends Component {

		constructor(params){
			super(params);
			this.expression = ko.pureComputed(() => params.currentConceptSet() && params.currentConceptSet().expression);
		}
	}

	return commonUtils.build('conceptset-list-included-badge', IncludedBadge, view);
});