define([
	'knockout',
	'providers/Component',
	'utils/CommonUtils',
	'lodash',
	'text!./linked-cohort-list.html',
	'components/cohort-definition-browser',
	'less!./linked-cohort-list.less',
	'components/linked-entity-list',
	'components/modal',
	'databindings'
], function (
	ko,
	Component,
	commonUtils,
	lodash,
	view
) {
	class LinkedCohortList extends Component {
		constructor(params) {
			super();

			this.showCohortModal = this.showCohortModal.bind(this);
			this.removeCohort = this.removeCohort.bind(this);

			const nameCol = {
				title: 'Name'
			};
			
			if (params.canEditName) {
				nameCol.render = (s,p,d) => `<span data-bind="clickToEdit: name"/>`;
				nameCol.className = this.classes({element: 'table', extra: ['edit']});
			} else {
				nameCol.data = 'name',
				nameCol.className = this.classes('col-cohort-name')
			}
			
			// Linked entity list props
			this.title = params.title || 'Cohort definitions';
			this.descr = params.descr;
			this.newItemLabel = params.newItemLabel || 'Import';
			this.newItemAction = params.newItemAction || this.showCohortModal;
			this.data = params.data || ko.observable([]);
			this.columns = params.columns || [
				{
					title: 'ID',
					data: 'id',
					className: this.classes('col-cohort-id'),
				},
				nameCol,
				{
					title: 'Actions',
					render: this.getRemoveCell('removeCohort'),
					className: this.classes('col-cohort-remove'),
				}
			];
			
			// edit support
			this.editRow = ko.observable(null);

			// Modal props
			this.showModal = ko.observable(false);
			this.cohortSelected = ko.observable();

			// subscriptions
			this.cohortSelectedSubscr = this.cohortSelected.subscribe(cohort => this.attachCohort(cohort));
		}

		dispose() {
			this.cohortSelectedSubscr.dispose();
		}

		getRemoveCell(action, identifierField = 'id') {
			return (s, p, d) => {
				return `<a data-bind="click: () => $component.params.${action}('${d[identifierField]}')">Remove</a>`;
			}
		}
		
		getEditCell() {
			return (s,p,d) => {
				return `<span data-bind="clickToEdit: name"/>`;
			}
		}

		showCohortModal() {
			this.showModal(true);
		}

		attachCohort({ id, name }) {
			const data = this.data();
			this.showModal(false);
			this.data(
				lodash.uniqBy(
					[
						...data,
						{ id, name }
					],
					'id'
				).map(d => { d.name = ko.observable(ko.utils.unwrapObservable(d.name)); return d})
			);
		}

		removeCohort(id) {
			this.data(this.data().filter(a => a.id !== parseInt(id)));
		}
		
	}

	return commonUtils.build('linked-cohort-list', LinkedCohortList, view);
});
