define([
        'knockout',
        'pages/characterizations/services/CharacterizationService',
        'pages/characterizations/const',
        'text!./characterization-executions.html',
        'appConfig',
        'webapi/AuthAPI',
        'moment',
        'providers/Component',
        'utils/CommonUtils',
        'utils/DatatableUtils',
        'services/Source',
        'less!./characterization-executions.less',
        './characterization-results',
], function (
    ko,
    CharacterizationService,
    consts,
    view,
    config,
    authApi,
    moment,
    Component,
    commonUtils,
    datatableUtils,
    SourceService
) {
        class CharacterizationViewEditExecutions extends Component {
            constructor(params) {
                super();

                this.ccGenerationStatusOptions = consts.ccGenerationStatus;

                this.showExecutionDesign = this.showExecutionDesign.bind(this);
                this.toggleSection = this.toggleSection.bind(this);
                this.goToResults = this.goToResults.bind(this);

                this.params = params;

                const STATUS_PROCESSING = 'Processing';
                const currentHash = ko.computed(() => params.design().hash);

                this.loading = ko.observable(false);
                this.expandedSection = ko.observable();
                this.isExecutionDesignShown = ko.observable(false);

                this.execColumns = [
                    {
                        title: 'Date',
                        className: this.classes('col-exec-date'),
                        render: datatableUtils.getDateFieldFormatter('startTime'),
                        type: 'date'
                    },
                    {
                        title: 'Design',
                        className: this.classes('col-exec-checksum'),
                        render: (s, p, d) => {
                            return `<a data-bind="css: $component.classes('design-link'), click: () => $component.showExecutionDesign(${d.id})">${d.hashCode}</a>${currentHash() === d.hashCode ? ' (same as now)' : ''}`;
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
                            const durationSec = (d.endTime - d.startTime) / 1000;
                            return `${Math.floor(durationSec / 60)} min ${Math.round(durationSec % 60)} sec`;
                        }
                    },
                    {
                        title: 'Results',
                        data: 'results',
                        className: this.classes('col-exec-results'),
                        render: (s, p, d) => {
                            return d.status === this.ccGenerationStatusOptions.STARTED ? '-' : `<a data-bind="css: $component.classes('reports-link'), click: $component.goToResults.bind(null, id)">View reports</a>`; // ${d.reportCount}
                        }
                    }
                ];

                this.executionGroups = ko.observable([]);
                this.executionDesign = ko.observable(null);

                this.loadData();

                this.intervalId = setInterval(() => this.loadData({ silently: true }), 10000)
            }

            dispose() {
                clearInterval(this.intervalId);
            }

            loadData({ silently = false } = {}) {
                !silently && this.loading(true);

                const ccId = this.params.characterizationId();

                Promise.all([
                    SourceService.loadSourceList(),
                    CharacterizationService.loadCharacterizationExecutionList(ccId)
                ]).then(([
                    sourceList,
                    executionList
                ]) => {
                    const execGroups = sourceList.map(s => {
                        const group = {
                            sourceKey: s.sourceKey,
                            sourceName: s.sourceName,
                            submissions: executionList.filter(e => e.sourceKey === s.sourceKey)
                        };
                        group.status = group.submissions.find(s => s.status === this.ccGenerationStatusOptions.STARTED)
                            ? this.ccGenerationStatusOptions.STARTED
                            : this.ccGenerationStatusOptions.COMPLETED;

                        return group;
                    });
                    this.executionGroups(execGroups);
                    this.loading(false);
                });
            }

            generate(source) {
                let confirmPromise;

                if (this.executionGroups().find(g => g.sourceKey === source).status === this.ccGenerationStatusOptions.STARTED) {
                    confirmPromise = new Promise((resolve, reject) => {
                        if (confirm('A generation for the source has already been started. Are you sure you want to start a new one in parallel?')) {
                            resolve();
                        } else {
                            reject();
                        }
                    })
                } else {
                    confirmPromise = new Promise(res => res());
                }

                confirmPromise
                    .then(() => CharacterizationService.runGeneration(this.params.characterizationId(), source))
                    .then(() => this.loadData())
                    .catch(() => {});
            }

            showExecutionDesign(executionId) {
                this.executionDesign(null);
                this.isExecutionDesignShown(true);

                CharacterizationService
                    .loadCharacterizationDesignByGeneration(executionId)
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
