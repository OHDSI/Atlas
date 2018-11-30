define([
	'knockout',
	'text!./explore-prevalence.html',
	'components/Component',
	'utils/CommonUtils',
	'utils/AutoBind',
	'pages/characterizations/services/CharacterizationService',
	'./utils',
	'numeral',
	'less!./explore-prevalence.less',
], function(
	ko,
	view,
	Component,
	commonUtils,
	AutoBind,
	CharacterizationService,
	utils,
	numeral,
){

	class ExplorePrevalence extends AutoBind(Component) {

		constructor(params) {
			super(params);
			this.tableColumns = [
				{ title: 'Relationship type', render: this.renderRelationship, class: this.classes('col-type'), },
				{ title: 'Distance', data: 'distance', class: this.classes('col-distance'), },
				{ title: 'Concept name', data: 'covariateName', class: this.classes('col-concept'), },
			];
			this.data = ko.observableArray();
			this.loading = ko.observable();
			this.explore = params.explore;
			this.cohortId = this.explore.cohortId;
			this.cohortName = this.explore.cohortName;
			this.exploring = ko.observable();
			this.relations = ko.computed(() => this.prepareTabularData(this.data()));
			this.exploringTitle = ko.pureComputed(() => this.exploring() ? 'Exploring concept hierarchy for: ' + this.exploring() : null );
			this.loadData(this.explore);
		}

		loadData({executionId, analysisId, cohortId, covariateId}) {
			this.loading(true);
			return CharacterizationService.getPrevalenceStatsByGeneration(executionId, analysisId, cohortId, covariateId)
				.then(res => this.data(res.map(v => ({...v, executionId}))))
				.finally(() => this.loading(false));
		}

		getCountColumn(strata) {
			return {
				title: 'Count',
				class: this.classes('col-count'),
				render: (s, p, d) => numeral(d.count[strata] || 0).format(),
			};
		}

		getPctColumn(strata, idx) {
			return {
				title: 'Pct',
				class: this.classes('col-pct'),
				render: (s, p, d) => utils.formatPct(d.pct[strata] || 0),
			};
		}

		prepareTabularData(data) {
			const columns = [
				...this.tableColumns,
			];
			let stratas = {
			};
			let stats = {};
			data.forEach(st => {
				if (stats[st.covariateId] === undefined) {
					stats[st.covariateId] = {
						...st,
						count: {},
						pct: {},
					};
				}
				if (stratas[st.strataId] === undefined) {
					stratas[st.strataId] = st.strataName || 'All stratas';
				}
				const stat = stats[st.covariateId];
				stat.count[st.strataId] = st.count;
				stat.pct[st.strataId] = st.avg;
			});
			Object.keys(stratas).forEach(strataId => {
				columns.push(this.getCountColumn(strataId));
				columns.push(this.getPctColumn(strataId));
			});
			stats = Object.values(stats);
			stratas = Object.values(stratas);
			return {
				stats,
				stratas,
				columns,
			};
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
			const cls = this.classes({element: 'explore', modifiers: distance === 0 ? 'disabled' : '' });
			const binding = distance !== 0 ? 'click: () => $component.exploreByFeature({...$data, cohortId: $component.cohortId})' : '';
			return "<a class='"+ cls + "' data-bind='" + binding + "'>Explore</a> " + rel;
		}

	}

	commonUtils.build('explore-prevalence', ExplorePrevalence, view);

});