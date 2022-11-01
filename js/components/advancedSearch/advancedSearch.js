define([
    'knockout',
    'components/Component',
    'utils/AutoBind',
    'utils/CommonUtils',
    'text!./advancedSearch.html',
    'services/http',
    'pages/vocabulary/const',
    './components/panelList',
], function (
    ko,
    Component,
    AutoBind,
    commonUtils,
    view,
    httpService,
    constants,
) {
    class AdvancedSearch extends AutoBind(Component) {
        constructor(params) {
            super(params);
            this.querySearch = ko.observable('');
            this.loading = ko.observable(false);
            this.domains = ko.observable();
            this.selectedDomains = new Set();
            this.panelCollapsable = ko.observable(true);
            this.searchConceptSets = params.searchConceptSets;
            this.showSearch = params.showSearch;
            this.getDomains();

            //subscriptions
            this.showSearch.subscribe((newValue) => {
                if(!newValue) {
                    this.panelCollapsable(true);
                }
            });
        }

        clearAll(data,event) {
            event.stopPropagation();
            $('.advanced-options input').attr('checked', false);
            this.selectedDomains.clear();
        }

        selectDomain(id) {
            this.selectedDomains.has(id)
                ? this.selectedDomains.delete(id)
                : this.selectedDomains.add(id, true);
        }

        search() {
            if (this.querySearch().trim().length < 2) {
                return alert('Search must have at least 2 letters');
            }
            const searchParams = {
                query: this.querySearch,
                domainId: Array.from(this.selectedDomains)
            };
            this.panelCollapsable(false);
            this.searchConceptSets(searchParams);

        }

        getDomains() {
            this.loading(true);
            httpService.doGet(constants.apiPaths.domains())
                .then(({ data }) => {
                    this.domains(data);
                })
                .catch(er => console.error('Error occured when loading domains', er))
                .finally(() => {
                    this.loading(false);
                });
        }
    }
    return commonUtils.build('advanced-search', AdvancedSearch, view);
});
