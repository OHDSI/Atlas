define([
	'knockout',
	'text!./select-sources-btn.html',
	'components/Component',
	'utils/AutoBind',
	'utils/CommonUtils',
	'less!./select-sources-btn.less',
	'components/modal-pick-options',
	'./select-sources-popup',
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

			this.sources = ko.computed(() => params.sources().map(s => ({
				name: s.sourceName,
				key: s.sourceKey,
				disabled: typeof s.disabled !== 'undefined' ? s.disabled : false,
				disabledReason: s.disabledReason,
				selected: ko.observable()
			})));
			this.selectedSources = ko.observableArray((this.sources().length === 1 && !this.sources().disabled) ? [this.sources()[0].key] : []);
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