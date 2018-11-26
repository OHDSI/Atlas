define([
	'knockout',
	'text!./explore-prevalence.html',
	'components/Component',
	'utils/CommonUtils',
	'utils/AutoBind',
	'pages/characterizations/services/CharacterizationService',
	'./utils',
	'less!./explore-prevalence.less',
], function(
	ko,
	view,
	Component,
	commonUtils,
	AutoBind,
	CharacterizationService,
	utils,
){

	class ExplorePrevalence extends AutoBind(Component) {

		constructor(params) {
			super(params);
			this.tableColumns = [
				{ title: 'Relationship type', render: this.renderRelationship, width: '25%', },
				{ title: 'Distance', data: 'distance', width: '10%', },
				{ title: 'Concept name', data: 'covariateName', width: '45%', },
				{ title: 'Count', data: 'count', width: '10%', },
				{ title: 'Pct', data: 'avg', render: (val) => utils.formatPct(val * 100), width: '10%', },
			];
			this.data = ko.observableArray();
			this.loading = ko.observable();
			this.explore = params.explore;
			this.cohortId = this.explore.cohortId;
			this.cohortName = this.explore.cohortName;
			this.exploring = ko.observable();
			this.exploringTitle = ko.pureComputed(() => this.exploring() ? 'Exploring concept hierarchy for: ' + this.exploring() : null );
			this.loadData(this.explore);
		}

		loadData({executionId, analysisId, cohortId, covariateId}) {
			this.loading(true);
			return CharacterizationService.getPrevalenceStatsByGeneration(executionId, analysisId, cohortId, covariateId)
				.then(res => this.data(res.map(v => ({...v, executionId}))))
				.finally(() => this.loading(false));
		}

		exploreByFeature(data) {
			this.loadData(data).then(() => this.exploring(data.covariateName));
		}

		resetExploring() {
			this.loadData(this.explore).then(() => this.exploring(null));
		}

		renderRelationship(data, type, row) {
			const distance = row.distance;
			const rel = distance > 0 ? 'Ancestor' : distance < 0 ? 'Descendant' : 'Selected';
			const cls = this.classes({element: 'explore', modifiers: distance === 0 ? 'disabled' : '', extra: 'btn btn-sm btn-primary'});
			const binding = distance !== 0 ? 'click: () => $component.exploreByFeature({...$data, cohortId: $component.cohortId})' : '';
			return "<span class='"+ cls + "' data-bind='" + binding + "'>Explore</span> " + rel;
		}

	}

	commonUtils.build('explore-prevalence', ExplorePrevalence, view);

});