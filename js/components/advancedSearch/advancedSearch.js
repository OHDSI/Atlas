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
            this.showAdvanced = ko.observable(false);
            this.refreshConceptSets = params.refreshConceptSets;
            this.getDomains();

            //subscriptions
            this.showSearch.subscribe((newValue) => {
                if(!newValue) {
                    this.panelCollapsable(true);
                    this.showAdvanced(false);
                    this.refreshConceptSets();
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
            this.showAdvanced(false);
            this.panelCollapsable(true);
            this.searchConceptSets(searchParams);

        }

        resetSearchConceptSets() {
            $('.advanced-options input').attr('checked', false);
            this.selectedDomains.clear();
            this.querySearch('');
            this.showAdvanced(false);
            this.panelCollapsable(true);
            this.refreshConceptSets();
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

        toggleAdvanced() {
            if(this.showAdvanced()) {
                this.panelCollapsable(true);
            }
            this.showAdvanced(!this.showAdvanced());
        }

    }
    return commonUtils.build('advanced-search', AdvancedSearch, view);
});
