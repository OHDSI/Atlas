define([
	'knockout',
	'text!./select-sources-btn.html',
	'components/Component',
	'utils/AutoBind',
	'utils/CommonUtils',
	'less!./select-sources-btn.less',
	'components/modal-pick-options',
], function(
	ko,
	view,
	Component,
	AutoBind,
	commonUtils
){

	class SelectSourcesBtn extends AutoBind(Component){

		constructor(params) {
			super(params);

			this.label = typeof params.label === 'undefined' ? 'Generate' : params.label;
			this.wasGenerated = typeof params.wasGenerated === 'undefined' ? false : params.wasGenerated;

			this.sources = params.sources;
			this.selectedSources = ko.observableArray(this.sources().length === 1 ? [this.sources()[0].sourceKey] : []);

			this.sourceOptions = ko.computed(() => ({
				options: this.sources().map(s => ({
					label: s.sourceName,
					value: s.sourceKey,
					disabled: typeof s.disabled !== 'undefined' ? s.disabled : false,
					disabledReason: s.disabledReason,
				})),
				selectedOptions: this.selectedSources,
			}));
			this.callback = params.callback;

			this.shouldSuggestSelection = ko.computed(() => this.sources().length > 1);
			this.isPopupShown = ko.observable(false);
		}

		showPopup() {
			this.isPopupShown(true);
		}

		hidePopup() {
			this.isPopupShown(false);
		}

		generate() {
			if (this.selectedSources().length === 0) {
				alert('Pick at least one source to generate')
			}
			this.callback(this.selectedSources());
			this.hidePopup();
		}

	}

	commonUtils.build('select-sources-btn', SelectSourcesBtn, view);
});