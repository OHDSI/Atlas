define([
	'knockout',
	'text!./modal-exit-message.html',
	'components/Component',
	'utils/AutoBind',
	'utils/Clipboard',
	'utils/CommonUtils',
	'less!./modal-exit-message.less',
], function(
	ko,
	view,
	Component,
	AutoBind,
	Clipboard,
	commonUtils,
){

	class ModalExitMessage extends AutoBind(Clipboard(Component)) {
		constructor(params) {
			super(params);

			const {
				showModal,
				title,
				exitMessage,
				buttonId = "copyExitMessage",
				noticeId = "copyExitMessageNotice",
			} = params;

			this.showModal = showModal;
			this.title = title;
			this.exitMessage = exitMessage;
			this.buttonId = buttonId;
			this.noticeId = noticeId;
		}

		copyExitMessageToClipboard() {
			this.copyToClipboard(`#${this.buttonId}`, `#${this.noticeId}`);
		}
	}

	return commonUtils.build('modal-exit-message', ModalExitMessage, view);
});