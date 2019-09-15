define([
	'knockout',
	'text!./cohort-definition-browser.html',
	'appConfig',
	'atlas-state',
	'services/AuthAPI',
	'services/MomentAPI',
	'components/Component',
	'utils/CommonUtils',
	'services/http',
	'utils/DatatableUtils',
	'utils/Renderers',
	'faceted-datatable',
	'less!./cohort-definition-browser.less',
], function (
	ko,
	view,
	config,
	sharedState,
	authApi,
	momentApi,
	Component,
	commonUtils,
	httpService,
	datatableUtils,
	renderers,
) {

	class CohortDefinitionBrowser extends Component {
		constructor(params) {
			super(params);
			this.selected = params.cohortDefinitionSelected;
			this.multi = params.multi || false;
			this.showModal = params.showModal;
			this.selectedIds = this.mulit && param.data ? (params.data() || []).map(({ id }) => id) : [];
			this.data = ko.observableArray();
			this.currentConceptSet = sharedState.ConceptSet.current;
			this.currentConceptSetDirtyFlag = sharedState.ConceptSet.dirtyFlag;
			this.isLoading = ko.observable(false);
			this.importEnabled = ko.pureComputed(() => this.data().some(i => i.selected()));
			this.options = {
				Facets: [
					{
						'caption': 'Last Modified',
						'binding': function (o) {
							const createDate = new Date(o.createdDate);
							const modDate = new Date(o.modifiedDate);
							const dateForCompare = (createDate > modDate) ? createDate : modDate;
							const daysSinceModification = (new Date().getTime() - dateForCompare.getTime()) / 1000 / 60 / 60 / 24;
							if (daysSinceModification < 7) {
								return 'This Week';
							} else if (daysSinceModification < 14) {
								return 'Last Week';
							}
							return '2+ Weeks Ago';
						}
					},
					{
						'caption': 'Author',
						'binding': function (o) {
							return o.createdBy;
						}
					},
				],
			};

			this.columns = [
				{
					title: 'Id',
					className: 'id-column',
					data: 'id'
				},
				{
					title: 'Name',
					render: datatableUtils.getLinkFormatter(d => ({ label: d['name'], linkish: !this.multi })),
				},
				{
					title: 'Created',
					className: 'date-column',
					render: datatableUtils.getDateFieldFormatter('createdDate'),
				},
				{
					title: 'Updated',
					className: 'date-column',
					render: datatableUtils.getDateFieldFormatter('modifiedDate'),
				},
				{
					title: 'Author',
					className: 'author-column',
					render: datatableUtils.getCreatedByFormatter(),
				},
			];

			if (!!this.multi) {
				this.columns = [
					{
						data: 'selected',
						class: this.classes({extra: 'text-center'}),
						render: () => renderers.renderCheckbox('selected'),
						searchable: false,
						orderable: false,
					},
					...this.columns,
				];
			}

			this.buttons = !!this.multi ? [
				{
					text: 'Select All', action: () => this.toggleSelected(true), className: this.classes({extra: 'btn btn-sm btn-success'}),
					init: this.removeClass('dt-button')
				},
				{
					text: 'Deselect All', action: () => this.toggleSelected(false), className: this.classes({extra: 'btn btn-sm btn-primary'}),
					init: this.removeClass('dt-button')
				}
			] : null;

			this.tableDom = "Bfiprt<'page-size'l>ip";

			this.rowClick = this.rowClick.bind(this);
			this.loadData();
		}

		removeClass(className) {
			return (dt, node, cfg) => node.removeClass(className);
		}

		rowClick(data) {
			this.action(() => this.selected([data]));
		}

		action(callback) {
			const isConceptSetDirty = this.currentConceptSet() && this.currentConceptSetDirtyFlag().isDirty();
			if (isConceptSetDirty) {
				if (confirm('Concept set changes are not saved. Would you like to continue?')) {
					callback();
				}
			} else {
				callback();
			}
		}

		async loadData() {
			try {
				this.isLoading(true);
				const { data } = await httpService.doGet(`${config.api.url}cohortdefinition`);
				datatableUtils.coalesceField(data, 'modifiedDate', 'createdDate')
				this.data(data.map(item => ({ selected: ko.observable(this.selectedIds.includes(item.id)), ...item })));
			} catch (err) {
				console.error(err);
			} finally {
				this.isLoading(false);
			}
		}

		import() {
			const selected = this.data().filter(i => i.selected());
			this.action(() => this.selected(selected));
		}

		cancel() {
			this.showModal(false);
		}

		toggleSelected(selected) {
			this.data().forEach(i => i.selected(selected));
		}

	}

	return commonUtils.build('cohort-definition-browser', CohortDefinitionBrowser, view);
});
