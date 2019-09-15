define([
	'knockout',
	'text!./cohort-definition-browser.html',
	'components/Component',
	'faceted-datatable',
	'less!./cohort-definition-browser.less',
], function (
	ko,
	view,
	Component,
) {

	class EntityBrowser extends Component {
		constructor(params) {
            super(params);
            this.onSelect = params.onSelect;
			this.multiChoice = params.multiChoice || false;
            this.showModal = params.showModal;
            this.scrollY = params.scrollY || '50vh';
            this.scrollCollapse = params.scrollCollapse || false;
			this.selectedDataIds = this.multiChoice && params.selectedData ? (params.selectedData() || []).map(({ id }) => id) : [];
			this.data = ko.observableArray([]);
			this.isLoading = ko.observable(false);
			this.importEnabled = ko.pureComputed(() => this.data().some(i => i.selected()));


			this.buttons = !!this.multiChoice ? [
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
			this.loadData();
		}

		removeClass(className) {
			return (dt, node, cfg) => node.removeClass(className);
		}

		action(callback) {
            callback();
		}

		import() {
			const selectedItems = this.data().filter(i => i.selected());
			this.action(() => this.onSelect(selectedItems));
		}

		cancel() {
			this.showModal(false);
		}

		toggleSelected(selected) {
			this.data().forEach(i => i.selected(selected));
		}

	}

	return EntityBrowser;
});
