define([
	'knockout',
	'components/Component',
	'utils/CommonUtils',
	'text!./linked-entity-list.html',
	'components/cohort-definition-browser',
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
			this.newItemLabel = params.newItemLabel || 'Import';
			this.newItemAction = params.newItemAction;
			this.data = params.data;
			this.columns = params.columns;
		}
	}

	return commonUtils.build('linked-entity-list', LinkedEntityList, view);
});
