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
			this.selectedConcepts = params.selectedConcepts;
		}
	}

	return commonUtils.build('conceptset-list-included-badge', IncludedBadge, view);
});