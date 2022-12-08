define([
	'knockout',
	'text!./explore-prevalence.html',
	'components/Component',
	'utils/CommonUtils',
	'utils/AutoBind',
	'pages/characterizations/services/CharacterizationService',
	'pages/characterizations/utils',
	'./utils',
	'numeral',
	'utils/CsvUtils',
	'less!./explore-prevalence.less',
], function(
	ko,
	view,
	Component,
	commonUtils,
	AutoBind,
	CharacterizationService,
	pageUtils,
	utils,
	numeral,
	CsvUtils,
){

	class ExplorePrevalence extends AutoBind(Component) {

		constructor(params) {
			super(params);
			this.tableColumns = [
				{
					title: ko.i18n('columns.relationshipType', 'Relationship type'),
					render: this.renderRelationship,
					class: this.classes('col-type'),
				},
				{
					title: ko.i18n('columns.distance', 'Distance'),
					data: 'distance',
					class: this.classes('col-distance'),
				},
				{
					title: ko.i18n('columns.conceptName', 'Concept name'),
					data: 'covariateName',
					class: this.classes('col-concept'),
					render: (d, t, { covariateName, faType }) =>  pageUtils.extractMeaningfulCovName(covariateName, faType)
				},
			];
			this.data = ko.observableArray();
			this.loading = ko.observable();
			this.explore = params.explore;
			this.cohortId = this.explore.cohortId;
			this.cohortName = this.explore.cohortName;
			this.exploring = ko.observable();
			this.relations = ko.computed(() => this.prepareTabularData(this.data()));
			this.tableOptions = commonUtils.getTableOptions('M');
			this.exploringTitle = ko.pureComputed(() => this.exploring() ? ko.i18n('cc.viewEdit.executions.prevalenceStatConverter.exploringConceptHierarchyFor', 'Exploring concept hierarchy for: ')() + ' ' + this.exploring() : null );
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
				title: ko.i18n('columns.count', 'Count'),
				class: this.classes('col-count'),
				render: (s, p, d) => numeral(d.count[strata] || 0).format(),
			};
		}

		getPctColumn(strata, idx) {
			return {
				title: ko.i18n('columns.pct', 'Pct'),
				class: this.classes('col-pct'),
				render: (s, p, d) => {
					const pct = utils.formatPct(d.pct[strata] || 0);
					return `<div class="pct-fill" style="width: ${pct}"><div>${pct}</div></div>`;
				},
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
					stratas[st.strataId] = st.strataName || ko.i18n('cc.viewEdit.executions.prevalenceStatConverter.allStrata', 'All strata')();
				}
				const stat = stats[st.covariateId];
				stat.count[st.strataId] = st.count;
				stat.pct[st.strataId] = st.avg * 100;
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
			this.loadData(data).then(() => {
				if (data.covariateId !== this.explore.covariateId) {
					this.exploring(data.covariateName);
				} else {
					this.exploring(null);
				}
			});
		}

		getButtonsConfig() {
			const buttons = [];

			buttons.push({
				text: ko.i18n('common.export', 'Export')(),
				action: () => this.exportTable()
			});

			return buttons;
		}

		exportTable() {
			const exprt = this.relations().stats.map(stat => {
				return ({
					'Relationship Type': this.getRelationshipTypeFromDistance(stat.distance),
					'Distance' : stat.distance,
					'Covariate short name': stat.conceptName,
					'Count': stat.count[stat.strataId],
					'Percent': stat.pct[stat.strataId],
					'Strata ID': stat.strataId,
					'Strata name': stat.strataName,
					'Analysis ID': stat.analysisId,
					'Analysis name': stat.analysisName,
					'Covariate ID': stat.covariateId,
					'Covariate name': stat.covariateName
				});
			});
			exprt.sort((a,b) => b["Distance"] - a["Distance"]);
			CsvUtils.saveAsCsv(exprt);
		}

		resetExploring() {
			this.loadData(this.explore).then(() => this.exploring(null));
		}

		renderRelationship(data, type, row) {
			const distance = row.distance;
			const rel = this.getRelationshipTypeFromDistance(distance);
			const cls = this.classes({element: 'explore', modifiers: distance === 0 ? 'disabled' : '' });
			const binding = distance !== 0 ? 'click: () => $component.exploreByFeature({...$data, cohortId: $component.cohortId})' : '';
			return "<a class='"+ cls + "' data-bind='" + binding + "'><span data-bind=\"text: ko.i18n('cc.viewEdit.executions.prevalenceStatConverter.explore', 'Explore')\"></span></a> " + rel;
		}

		getRelationshipTypeFromDistance(distance) {
			return distance > 0 ?
				ko.i18n('cc.viewEdit.executions.prevalenceStatConverter.ancestor', 'Ancestor')() :
				distance < 0 ?
					ko.i18n('cc.viewEdit.executions.prevalenceStatConverter.descendant', 'Descendant')() :
			    ko.i18n('cc.viewEdit.executions.prevalenceStatConverter.selected', 'Selected')();
		}

	}

	commonUtils.build('explore-prevalence', ExplorePrevalence, view);

});
