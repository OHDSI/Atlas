define([
	'knockout',
	'components/Component',
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
				iconClass,
				title,
				template,
				data,
				backdropClosable = true,
				fade = ko.observable(true),
				footerTemplate,
			} = params;

			this.showModal = showModal;
			this.iconClass = iconClass;
			this.title = title;
			this.template = template;
			this.data = data;
			this.fade = fade;
			this.backdropClosable = backdropClosable;
			this.footerTemplate = footerTemplate;
		}
	}

	return commonUtils.build('atlas-modal', AtlasModal, view);
});
