define([
	'knockout',
	'text!./concept-details.html',
	'components/Component',
	'utils/CommonUtils',
	'services/MomentAPI',
	'less!./concept-details.less',
], function (
	ko,
	view,
	Component,
	commonUtils,
	momentApi
) {
	class ConceptDetails extends Component {
		constructor(params) {
			super(params);
			this.currentConcept = params.currentConcept;
			this.hasInfoAccess = params.hasInfoAccess;
			this.isAuthenticated = params.isAuthenticated;
		}

		formatDate(date) {
			return momentApi.formatDateTimeWithFormat(date, momentApi.ISO_DATE_FORMAT);
		}
	}

	return commonUtils.build('concept-details', ConceptDetails, view);
});
