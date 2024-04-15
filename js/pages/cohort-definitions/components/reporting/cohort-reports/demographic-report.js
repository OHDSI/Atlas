define([
	'knockout',
	'services/CohortDefinition',
	'utils/CommonUtils',
	'atlas-state',
	'text!./demographic-report.html',
    'utils/DatatableUtils',
    'components/entity-browser',
    'faceted-datatable',
], function (
	ko,
	CohortDefinitionService,
	commonUtils,
	sharedState,
	view,
    datatableUtils,
    EntityBrowser
) {
	class DemographicReport extends EntityBrowser {
		constructor(params) {
			super(params);
			this.isLoading = ko.observable(false);
            this.reportType = params.reportType;
            this.source = ko.pureComputed(() => {
				return sharedState.sources().find(s => s.sourceKey === params.sourceKey());
			});
			this.cohortId = params.cohortId;
            this.loadReport();
            this.dataDemographic = ko.observableArray();
			this.showModal = params.showModal;
			this.myDesignsOnly = params.myDesignsOnly || false;
			const { pageLength, lengthMenu } = commonUtils.getTableOptions('M');
			this.pageLength = params.pageLength || pageLength;
			this.lengthMenu = params.lengthMenu || lengthMenu;
            
            this.options = null;
            
			this.columns = ko.observableArray([
				{
					title: ko.i18n('columns.covariate', 'Covariate'),
					className: 'col-prev-title',
					data: 'covariateName',
                    sortable: true
				},
				{
                    title: ko.i18n('columns.explore', 'Explore'),
                    data: 'explore',
                    className: 'col-explore',
                    render: (d, t, r) => {
                        if (r.explore === null || r.explore === undefined) {
                            return 'N/A';
                        } else {
                            return `<p>${r.explore}</p>`
                        }
                    }
				},
				{
                    title: ko.i18n('columns.conceptId', 'Concept ID'),
                    data: 'conceptId',
                    render: (d, t, r) => {
                        if (r.conceptId === null || r.conceptId === undefined) {
                            return 'N/A';
                        } else {
                            return `<a href="#/concept/${r.conceptId}" data-bind="tooltip: '${r.conceptName ? commonUtils.escapeTooltip(r.conceptName) : null}'">${r.conceptId}</a>`
                        }
                    }
				},
				{
					title: ko.i18n('columns.count', 'Count'),
					className: 'date-column',
                    data: 'count'
				},
				{
					title: ko.i18n('columns.pct', 'Pct'),
					className: 'date-column',
                    render: (d, t, r) => {
                        if (r.pct === null || r.pct === undefined) {
                            return 'N/A';
                        } else {
                            return `<p>${r.pct}</p>`
                        }
                    }
				}
			]);
		}

        async loadData(){

        }
        
		async loadReport() {
			try {
				this.isLoading(true);
                const report = await CohortDefinitionService.getReport(this.cohortId(), this.source().sourceKey, this.reportType);
			    this.dataDemographic(report.demographicsStats);

			} catch (err) {
				console.error(err);
			} finally {
				this.isLoading(false);
			}
		}
	}

	return commonUtils.build('demographic-report', DemographicReport, view);
});
