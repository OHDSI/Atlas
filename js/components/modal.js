define([
	'knockout',
	'providers/Component',
	'utils/CommonUtils',
	'text!./modal.html',
	'less!./modal.less',
], function (
	ko,
	Component,
	commonUtils,
	view
) {
	class AtlasModal extends Component {
		constructor(params) {
			super();

			const {
				showModal,
				title,
				template,
				data,
				backdropClosable = true,
			} = params;

			this.showModal = showModal;
			this.title = title;
			this.template = template;
			this.data = data;
			this.backdropClosable = backdropClosable;
		}
	}

	return commonUtils.build('atlas-modal', AtlasModal, view);
});
