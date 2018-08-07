define([
        'knockout',
        'pages/characterizations/services/CharacterizationService',
        'text!./characterization-executions.html',
        'appConfig',
        'webapi/AuthAPI',
        'moment',
        'providers/Component',
        'utils/CommonUtils',
        'utils/DatatableUtils',
        'less!./characterization-executions.less',
        './characterization-results',
    ], function (
    ko,
    CharacterizationService,
    view,
    config,
    authApi,
    moment,
    Component,
    commonUtils,
    datatableUtils
    ) {
        class CharacterizationViewEditExecutions extends Component {
            constructor(params) {
                super();

                this.showExecutionDesign = this.showExecutionDesign.bind(this);
                this.toggleSection = this.toggleSection.bind(this);
                this.goToResults = this.goToResults.bind(this);

                const STATUS_PROCESSING = 'Processing';
                const currentHash = ko.computed(() => params.design().hash);

                this.loading = ko.observable(false);
                this.expandedSection = ko.observable();
                this.isExecutionDesignShown = ko.observable(false);

                this.execColumns = [
                    {
                        title: 'Date',
                        className: this.classes('col-exec-date'),
                        render: datatableUtils.getDateFieldFormatter('date')
                    },
                    {
                        title: 'Design',
                        className: this.classes('col-exec-checksum'),
                        render: (s, p, d) => {
                            return `<a data-bind="css: $component.classes('design-link'), click: () => $component.showExecutionDesign(${d.id})">${d.designHash}</a>${currentHash() === d.designHash ? ' (same as now)' : ''}`;
                        }
                    },
                    {
                        title: 'Status',
                        data: 'status',
                        className: this.classes('col-exec-status'),
                    },
                    {
                        title: 'Duration',
                        className: this.classes('col-exec-duration'),
                        render: (s, p, d) => {
                            return `${Math.floor(d.durationSec / 60)} min ${d.durationSec % 60} sec`;
                        }
                    },
                    {
                        title: 'Results',
                        data: 'results',
                        className: this.classes('col-exec-results'),
                        render: (s, p, d) => {
                            return d.status === STATUS_PROCESSING ? '-' : `<a data-bind="css: $component.classes('reports-link'), click: $component.goToResults.bind(null, id)">${d.reportCount} reports</a>`;
                        }
                    }
                ];

                this.executionGroups = ko.observable([]);
                this.executionDesign = ko.observable(null);

                this.loadData();
            }

            loadData() {
                this.loading(true);

                CharacterizationService
                    .loadCharacterizationExecutions()
                    .then(res => {
                        this.executionGroups(res);
                        this.loading(false);
                    });
            }

            showExecutionDesign(executionId) {
                this.executionDesign(null);
                this.isExecutionDesignShown(true);

                CharacterizationService
                    .loadExecutionDesign(executionId)
                    .then(res => {
                        this.executionDesign(res);
                        this.loading(false);
                    });
            }

            toggleSection(idx) {
                this.expandedSection() === idx ? this.expandedSection(null) : this.expandedSection(idx);
            }

            goToResults(executionId) {
                commonUtils.routeTo('/cc/characterizations/' + 1 + '/results/' + executionId);
            }
        }

        return commonUtils.build('characterization-view-edit-executions', CharacterizationViewEditExecutions, view);
    }
);
