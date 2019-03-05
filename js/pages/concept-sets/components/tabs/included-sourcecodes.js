define([
	'knockout',
	'text!./included-sourcecodes.html',
	'components/Component',
	'utils/CommonUtils',
], function (
	ko,
	view,
	Component,
  commonUtils,
) {
	class IncludedSourcecodes extends Component {
		constructor(params) {
			super(params);
			this.model = params.model;
			this.loading = ko.pureComputed(() => {
				return this.model.loadingSourcecodes() || this.model.loadingIncluded();
			});

      		// data load takes place in "Model.loadConceptSet" which is triggered by "router.js"
      		// or in "Model.onCurrentConceptSetModeChanged" which is triggered by tab switch
		}		

	}

	return commonUtils.build('included-sourcecodes', IncludedSourcecodes, view);
});