define([
	'knockout',
	'text!./copyToClipboard.html',
	'components/Component',
	'utils/AutoBind',
	'utils/CommonUtils',
	'utils/Clipboard',
	'less!./copyToClipboard.less',
], function(
	ko,
	view,
	Component,
	AutoBind,
	commonUtils,
	Clipboard,
){

	class CopyToClipboard extends AutoBind(Clipboard(Component)) {

		constructor(params) {
			super(params);
			const {copyButtonId = "btnCopyCohortSQLClipboard", copyMessageId = "copyCopyCohortSQLMessage"} = params;
			this.copyButtonId = ko.observable(copyButtonId);
			this.copyMessageId = ko.observable(copyMessageId);
			this.buttonText = ko.i18n('common.copyToClipboard', 'Copy To Clipboard');
			this.messageText = ko.i18n('common.copiedToClipboard', 'Copied To Clipboard!');
			this.selectedTab = params.selectedTab;
			this.componentParams = ko.computed(() => this.selectedTab().componentParams);
			this.clipboardTarget = ko.computed(() => '#' + this.componentParams().clipboardTarget);
		}

		copyDataToClipboard() {
			this.copyToClipboard("#" + this.copyButtonId(), "#" + this.copyMessageId());
		}

	}

	return commonUtils.build('copy-to-clipboard', CopyToClipboard, view);
});