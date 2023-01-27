define([
	'knockout',
	'text!./included-preview-badge.html',
	'components/Component',
	'utils/CommonUtils',
	'components/conceptsetInclusionCount/conceptsetInclusionCount',
], function(
	ko,
	view,
	Component,
	commonUtils,
){

	class IncludedPreviewBadge extends Component {

		constructor(params){
			super(params);
			this.expression = ko.pureComputed(() => {
				return {
					items: params.previewConcepts()
				}
			});
		}
	}

	return commonUtils.build('conceptset-list-included-preview-badge', IncludedPreviewBadge, view);
});