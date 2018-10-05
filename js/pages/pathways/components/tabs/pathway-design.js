define([
	'knockout',
	'text!./pathway-design.html',
	'providers/Component',
	'utils/CommonUtils',
	'../../const',
	'components/cohort/linked-cohort-list',
	'less!./pathway-design.less',
	'databindings'
], function (
	ko,
	view,
	Component,
	commonUtils,
	constants
) {
	class PathwayEditor extends Component {
		constructor(params) {
			super();
			this.params = params;
			this.design = params.design;

		}
		
		get combinationWindowOptions() {
			return constants.combinationWindowOptions;
		}

		get minCellCountOptions() {
			return constants.minCellCountOptions;
		}

		get maxDepthOptions() {
			return constants.maxDepthOptions;
		}
		
	}

	return commonUtils.build('pathway-design', PathwayEditor, view);
});
