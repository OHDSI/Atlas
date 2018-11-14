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
			this.exploring = ko.observable();
			this.exploringTitle = ko.pureComputed(() => this.exploring() ? 'Exploring concept hierarchy for: ' + this.exploring() : null );
			this.loadData(this.explore);
		}

		loadData({executionId, covariateId}) {
			this.loading(true);
			return CharacterizationService.getPrevalenceStatsByGeneration(executionId, covariateId)
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
			const cls = this.classes({element: 'explore', extra: 'btn btn-sm btn-primary'});
			return "<span class='"+ cls + "' data-bind='click: () => $component.exploreByFeature($data)'>Explore</span> " + rel;
		}

	}

	commonUtils.build('explore-prevalence', ExplorePrevalence, view);

});