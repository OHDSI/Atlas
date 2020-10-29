define([
	'knockout',
	'text!./concept-details.html',
	'components/Component',
	'utils/CommonUtils',
	'less!./concept-details.less',
], function (
	ko,
	view,
	Component,
	commonUtils,
) {
	class ConceptDetails extends Component {
		constructor(params) {
			super(params);
			this.currentConcept = params.currentConcept;
			this.hasInfoAccess = params.hasInfoAccess;
			this.isAuthenticated = params.isAuthenticated;
			this.addConcept = params.addConcept;
		}
	}

	return commonUtils.build('concept-details', ConceptDetails, view);
});
