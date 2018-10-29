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

			// on activate
			this.model.loadIncluded()
				.then(() => {
					if (this.model.includedSourcecodes().length === 0) {
						this.model.loadSourcecodes();
					}
				});
		}		

	}

	return commonUtils.build('included-sourcecodes', IncludedSourcecodes, view);
});