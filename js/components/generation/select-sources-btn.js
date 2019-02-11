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

			this.sourceOptions = ko.computed(() => (ko.utils.unwrapObservable(params.sources) || []).map(s => ({
				name: s.sourceName,
				disabled: typeof s.disabled !== 'undefined' ? s.disabled : false,
				disabledReason: s.disabledReason,
				source: s
			})));
			this.selectedSources = params.selectedSources || ko.observableArray();
			this.callback = params.callback;

			this.shouldSuggestSelection = ko.computed(() => this.sourceOptions().length > 1);
			this.isPopupShown = ko.observable(false);
		}

		showPopup() {
			this.isPopupShown(true);
		}

		hidePopup() {
			this.isPopupShown(false);
		}

		generate() {
			const selectedSources = ko.utils.unwrapObservable(this.selectedSources);
			
			if (selectedSources.length === 0) {
				alert('Pick at least one source to generate')
			}
			this.callback(selectedSources);
			this.hidePopup();
		}

	}

	commonUtils.build('select-sources-btn', SelectSourcesBtn, view);
});