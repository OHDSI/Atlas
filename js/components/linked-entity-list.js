define([
	'knockout',
	'components/Component',
	'utils/CommonUtils',
	'text!./linked-entity-list.html',
	'components/entityBrowsers/cohort-definition-browser',
	'less!./linked-entity-list.less',
], function (
	ko,
	Component,
	commonUtils,
	view
) {
	class LinkedEntityList extends Component {
		constructor(params) {
			super();

			this.params = params;

			this.title = params.title;
			this.descr = params.descr;
			this.newItemLabel = params.newItemLabel || ko.i18n('components.linkedEntityList.defaultNewItemLabel', 'Import');
			this.newItemAction = params.newItemAction;
			this.data = params.data;
			this.columns = params.columns;
			this.isEditPermitted = params.isEditPermitted;
			this.tableOptions = params.tableOptions || commonUtils.getTableOptions('S');
			this.language = ko.i18n('datatable.language');
		}
	}

	return commonUtils.build('linked-entity-list', LinkedEntityList, view);
});
