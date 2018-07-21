define([
        'knockout',
        'atlas-state',
        'text!./characterization-executions.html',
        'appConfig',
        'webapi/AuthAPI',
        'moment',
        'providers/Component',
        'utils/CommonUtils',
        'less!./characterization-executions.less',
        './characterization-results',
    ], function (
    ko,
    sharedState,
    view,
    config,
    authApi,
    moment,
    Component,
    commonUtils,
    ) {
        class CharacterizationViewEditExecutions extends Component {
            constructor(params) {
                super();

                const STATUS_PROCESSING = 'Processing';
                const currentHash = 'ad5b054';

                this.loading = ko.observable(false);
                this.expandedSection = ko.observable();

                this.toggleSection = this.toggleSection.bind(this);
                this.goToResults = this.goToResults.bind(this);

                this.execColumns = [
                    {
                        title: 'Date',
                        data: 'date',
                        className: this.classes('col-exec-date'),
                    },
                    {
                        title: 'Design',
                        data: 'design',
                        className: this.classes('col-exec-checksum'),
                        render: (s, p, d) => {
                            return `<a>${d.hash}</a>${currentHash === d.hash ? ' (same as now)' : ''}`;
                        }
                    },
                    {
                        title: 'Status',
                        data: 'status',
                        className: this.classes('col-exec-status'),
                    },
                    {
                        title: 'Duration',
                        data: 'duration',
                        className: this.classes('col-exec-duration'),
                    },
                    {
                        title: 'Results',
                        data: 'results',
                        className: this.classes('col-exec-results'),
                        render: (s, p, d) => {
                            return d.status === STATUS_PROCESSING ? '-' : `<a data-bind="click: $component.goToResults.bind(null, executionId)">${d.reportCount} reports</a>`;
                        }
                    }
                ];

                this.executionGroups = [
                    {
                        dataSourceName: 'SynPUF 110k (CDM v5.3)',
                        executionList: [
                            {
                                executionId: 1,
                                date: moment('2018-07-12 15:05:00').format(),
                                hash: 'ad5b054',
                                status: STATUS_PROCESSING,
                                duration: '10m 30sec',
                                reportCount: 0
                            },
                            {
                                executionId: 2,
                                date: moment('2018-07-10 15:05:00').format(),
                                hash: 'x6t21cda',
                                status: 'Finished',
                                duration: '22min 15sec',
                                reportCount: 10
                            }
                        ]
                    },
                    {
                        dataSourceName: 'Truven',
                        executionList: [
                            {
                                executionId: 3,
                                date: moment('2018-07-10 15:05:00').format(),
                                hash: 'ad5b054',
                                status: 'Finished',
                                duration: '3h 31min',
                                reportCount: 10
                            },
                        ]
                    }
                ];
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
