define([
    'knockout',
    'text!./cohort-definition-browser.html',
    'components/Component',
	'utils/Renderers',
    'faceted-datatable',
], function(ko, view, Component, renderers) {
    class EntityBrowser extends Component {
        constructor(params) {
            super(params);
            this.onSelect = params.onSelect;
            this.multiChoice = params.multiChoice || false;
            this.showModal = params.showModal;
            this.scrollY = params.scrollY || '50vh';
            this.scrollCollapse = params.scrollCollapse || false;
            this.selectedDataIds =
                this.multiChoice && params.selectedData
                    ? (params.selectedData() || []).map(({ id }) => id)
                    : [];
            this.data = ko.observableArray([]);
            this.isLoading = ko.observable(false);
            this.importEnabled = ko.pureComputed(() => this.data().some(i => i.selected()));
            this.filteredData = ko.observableArray([]);
            this.buttons = !!this.multiChoice
                ? [
                      {
                          text: 'Select All',
                          action: () => this.toggleSelected(true),
                          className: this.classes({ extra: 'btn btn-sm btn-success' }),
                          init: this.removeClass('dt-button'),
                      },
                      {
                          text: 'Deselect All',
                          action: () => this.toggleSelected(false),
                          className: this.classes({ extra: 'btn btn-sm btn-primary' }),
                          init: this.removeClass('dt-button'),
                      },
                  ]
                : null;

            this.columns = !!this.multiChoice
                ? [
                    {
                        data: 'selected',
                        class: this.classes({extra: 'text-center'}),
                        render: () => renderers.renderCheckbox('selected'),
                        searchable: false,
                        orderable: false,
                    },
                ] : [];

			this.tableDom = "Bfiprt<'page-size'l>ip";
			this.rowClick = this.rowClick.bind(this);
            this.loadData();
		}

		rowClick(data) {
			this.action(() => this.onSelect(data));
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
            const filteredData = (ko.utils.unwrapObservable(this.filteredData) || []).map(i => i.id);
            this.data().forEach(i => filteredData.length === 0 ? i.selected(selected) : (filteredData.includes(i.id) && i.selected(selected)));
        }
    }

    return EntityBrowser;
});
