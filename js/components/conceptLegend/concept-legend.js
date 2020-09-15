define([
	'knockout',
	'components/Component',
	'utils/CommonUtils',
	'text!./concept-legend.html',
	'less!./concept-legend.less',
], (
	ko,
	Component,
	CommonUtils,
	view,
) => {
	class ConceptLegend extends Component {
		constructor(params) {
			super(params);
		}
	}

	return CommonUtils.build('concept-legend', ConceptLegend, view);
});
