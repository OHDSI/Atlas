define([
    'knockout',
    'components/Component',
    'utils/Renderers',
    'utils/CommonUtils',
    'faceted-datatable',
], function(ko, Component, renderers, commonUtils) {
    class EntityBrowser extends Component {
        constructor(params) {
            super(params);
            this.onSelect = params.onSelect;
            this.multiChoice = params.multiChoice || false;
            this.showCheckboxes = params.showCheckboxes || false;
            this.renderLink = params.renderLink === undefined ? true : params.renderLink;
            this.showModal = params.showModal;
            this.scrollY = this.multiChoice ? (params.scrollY !== undefined ? params.scrollY : '50vh') : params.scrollY;
            this.scrollCollapse = params.scrollCollapse || false;
            this.selectedDataIds =
                (this.showCheckboxes || this.multiChoice) && params.selectedData
                    ? (params.selectedData() || []).map(({ id }) => id)
                    : [];
            this.data = ko.observableArray([]);
            this.isLoading = ko.observable(false);
            this.importEnabled = ko.pureComputed(() => this.data().some(i => i.selected()));
            this.dtApi = ko.observable();
            this.filteredData = ko.observableArray([]);
            this.buttons = !!this.multiChoice
                ? [
                      {
                          text: ko.i18n('common.selectAll', 'Select All')(),
                          action: () => this.toggleSelected(true),
                          className: this.classes({ extra: 'btn btn-sm btn-success' }),
                          init: this.removeClass('dt-button'),
                      },
                      {
                          text: ko.i18n('common.deselectAll', 'Deselect All')(),
                          action: () => this.toggleSelected(false),
                          className: this.classes({ extra: 'btn btn-sm btn-primary' }),
                          init: this.removeClass('dt-button'),
                      },
                  ]
                : null;

            this.columns = !!this.multiChoice || this.showCheckboxes
                ? [
                    {
                        data: 'selected',
                        width: '20px',
                        render: () => renderers.renderCheckbox('selected'),
                        searchable: false,
                        orderable: false,
                    },
                ] : [];

            this.tableDom = this.multiChoice ? "Bfiprt<'page-size'l>ip" : 'Blfiprt';
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
            const filteredData = this.dtApi() ? this.dtApi().getFilteredData() : [];
            commonUtils.selectAllFilteredItems(this.data, filteredData, selected);
        }
    }

    return EntityBrowser;
});
