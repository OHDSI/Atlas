define([
	'knockout',
	'../../PathwayService',
	'services/Source',
	'text!./pathway-results.html',
	'appConfig',
	'services/AuthAPI',
	'components/Component',
	'utils/AutoBind',
	'utils/CommonUtils',
	'services/MomentAPI',
	'atlascharts',
	'd3',
	'components/visualizations/filter-panel/utils',
	'utils/ChartUtils',
	'components/visualizations/filter-panel/filter-panel',
	'components/charts/sunburst',
	'components/nav-pills',
	'./pathway-tableview',
	'less!./pathway-results.less'
], function(
	ko,
	PathwayService,
	SourceService,
	view,
	config,
	authApi,
	Component,
	AutoBind,
	commonUtils,
	momentAPI,
	AtlasCharts,
	d3,
	filterUtils,
	ChartUtils,
) {

	const percentFormat = d3.format(".1%");
	const numberFormat = d3.format(",");
	const pills = [
		{ name: ko.i18n('pathways.manager.executions.results.visualization', 'Visualization'), key: "viz"},
		{ name: ko.i18n('pathways.manager.executions.results.tabular', 'Tabular'), key: "table"}
	];


	class PathwayResults extends AutoBind(Component) {


		constructor(params) {
			super();

			this.loading = ko.observable(false);

			this.executionId = params.executionId;
			this.analysisId = params.analysisId;
			this.execution = ko.observable();
			this.results = ko.observable();
			this.filterList = ko.observableArray([]);
			this.isExecutionDesignShown = ko.observable(false);
			this.executionDesign = ko.observable(null);
			this.loadExecutionDesignError = ko.observable(false);
			this.pathwaysObserver = ko.pureComputed(() => this.prepareResultData(this.results(), this.filterList()));

			this.executionId.subscribe(id => id && this.loadData());
			this.title = ko.computed(() => ko.unwrap(ko.i18n('pathways.manager.executions.results.title', 'Pathway Report for')) + ' ' + (this.results() && this.results().sourceName));

			this.pills = pills;
			this.MODE_VISUALIZATION = pills[0].key;
			this.MODE_TABULAR = pills[1].key;

			this.mode = ko.observable(pills[0].key);  // default to first pill

			this.loadData();
		}

		splitPathway(node) {
			if (isNaN(node.data.name)) {
				return [node];
			};

			let splitNodes = [...Number.parseInt(node.data.name).toString(2)].reverse().reduce((result, bit, i) => {
				if (bit == "1") {
					let nodeClone = Object.assign({}, node);
					nodeClone.data = {name: (1<<i).toString()};
					result.push(nodeClone);
				}
				return result;
			},[])

			const bandWidth = (node.y1 - node.y0) / splitNodes.length;

			return splitNodes.map((node, i) => {
				node.y0 = node.y0 + (i * bandWidth);
				node.y1 = node.y0 + bandWidth;
				return node;
			})
		}

		// get the sum of all size from hierarchy node
		sumChildren(node) {
			return node.children ? node.children.reduce((r, n) => r + this.sumChildren(n),0) : node.size;
		}

		summarizeHierarchy(data) {
			return {totalPathways: this.sumChildren(data)};
		}

		getAncestors(node) {
			var path = [];
			var current = node;
			while (current.parent) {
				path.unshift(current);
				current = current.parent;
			}
			return path;
		}

		getPathToNode(node) {
			const eventCohorts = this.pathwaysObserver().eventCohorts;
			const colors = this.pathwaysObserver().colors;
			let ancestors = this.getAncestors(node);
			let pathway = ancestors.map(p => (p.data.name == "end") ? {names: [{name: "end", color: colors("end")}], count: p.value} : {
				names: eventCohorts.filter(c => (c.code & Number.parseInt(p.data.name)) > 0)
								.map(ec => ({name: ec.name, color: colors(ec.code)})), count: p.value});
			return pathway;
		}

		tooltipBuilder(d) {
			const nameBuilder = (name, color) => `<span class="${this.classes('tip-name')}" style="background-color:${color}; color: ${name == 'end' ? 'black' : 'white'}">${name}</span>`;
			const stepBuilder = (step) => `<div class="${this.classes('tip-step')}">${step.names.map(n => nameBuilder(n.name, n.color)).join("")}</div>`;

			const path = this.getPathToNode(d);
			return `<div class="${this.classes('tip-container')}">${path.map(s => stepBuilder(s)).join("")}</div>`;
		}

		buildPathDetails(pathwayData, pathNode) {
			let pathway = this.getPathToNode(pathNode);

			// { names: [], personCount, remainPct}
			const rowBuilder = (path, i ,allPaths) => ({
				names: path.names,
				personCount: path.count,
				remainPct: path.count / pathwayData.summary.totalPathways
			});

			let rows = pathway.map(rowBuilder);
			rows.forEach((r, i) => {
				if (i> 0) {
					r.diffPct = rows[i-1].remainPct - r.remainPct;
					r.diff = rows[i-1].personCount - r.personCount;
				} else {
					r.diffPct = 1.0-r.remainPct;
					r.diff = pathwayData.summary.totalPathways - r.personCount;
				}
			});

			return {tableData: rows};
		}


		getFilterList(design) {
			const cohorts = design.targetCohorts.map(c => ({label: c.name, value: c.id}));

			return [
				{
					type: 'multiselect',
					label: ko.i18n('pathways.manager.executions.results.filters.cohorts', 'Cohorts'),
					name: 'cohorts',
					options: ko.observable(cohorts),
					selectedValues: ko.observable(cohorts.map(c => c.value)),
				}
			];
		}

		formatDate(date) {
			return momentAPI.formatDateTimeUTC(date);
		}

		formatNumber(value) {
			return 	numberFormat(value);
		}

		formatPct(value) {
			return percentFormat(value);
		}

		formatDetailValue(value, percent) {
			return this.formatNumber(value) + ' (' + this.formatPct(percent) + ')';
		}

		// used to 'capture' the data context in the knockout binding for use in the d3 callback
		pathClickHandler(pathwayData) {
			return (node) => {
				pathwayData.pathDetails(this.buildPathDetails(pathwayData, node));
			}
		}

		buildHierarchy(data) {
			return AtlasCharts.util
				.buildHierarchy(data,
					d => d.path,
					d => d.personCount
				);
		}

		loadData() {
			this.loading(true);

			Promise.all([
				SourceService.loadSourceList(),
				PathwayService.loadExportDesignByGeneration(this.executionId()),
				PathwayService.getExecution(this.executionId()),
				PathwayService.getResults(this.executionId())
			]).then(([
				sourceList,
				design,
				execution,
				executionResults
			]) => {
				const source = sourceList.find(s => s.sourceKey === execution.sourceKey);

				executionResults.pathwayGroups.forEach(pg => {
					pg.pathways.forEach(pw => {
						if (pw.path.split("-").length < design.maxDepth)
							pw.path = pw.path + "-end";
					});
				});

				const results = {
					executionId: this.executionId(),
					sourceId: source.sourceId,
					sourceName: source.sourceName,
					date: execution.endTime,
					design: design,
					designHash: execution.hashCode,
					data: executionResults
				};
				this.results(results);

				this.filterList(this.getFilterList(design));

				this.loading(false);
			});
		}

		prepareResultData(results, filters=[]) {

			const selectedCohortIds = filterUtils.getSelectedFilterValues(filters).cohorts;

			if (!results || selectedCohortIds == undefined || selectedCohortIds.length == 0) return null;


			const cohortPathways = selectedCohortIds.map(id => {
				let result = null;
				const pathwayGroup = results.data.pathwayGroups.find(g => id == g.targetCohortId);
				if (pathwayGroup) {
					const pathway = this.buildHierarchy(pathwayGroup.pathways);
					const targetCohort = results.design.targetCohorts.find(c => id == c.id);
					const summary = {...this.summarizeHierarchy(pathway), cohortPersons: pathwayGroup.targetCohortCount, pathwayPersons: pathwayGroup.totalPathwaysCount};
					result = {
						pathway,
						targetCohortName: targetCohort.name,
						targetCohortCount: this.formatNumber(summary.cohortPersons),
						personsReported: this.formatNumber(summary.pathwayPersons),
						personsReportedPct: this.formatPct(summary.pathwayPersons/summary.cohortPersons),
						summary,
						pathDetails: ko.observable()
					};
				}
				return result;
			}).filter(cp => cp);

			const eventCohorts = results.data.eventCodes.filter(ec => !ec.isCombo)
			const colorScheme = d3.scaleOrdinal(eventCohorts.length > 10 ? d3.schemeCategory20 : d3.schemeCategory10);
			// initialize colors based on design
			this.results().design.eventCohorts.forEach((d, i) => colorScheme(Math.pow(2,i)));
			const fixedColors = {"end": "rgba(185, 184, 184, 0.23)"};
			const colors = (d) => (fixedColors[d] || colorScheme(d));

			return {
				eventCodes: results.data.eventCodes,
				cohortPathways : cohortPathways,
				colors: colors,
				title: results.design.name,
				eventCohorts: eventCohorts
			};

		}

		async showExecutionDesign(executionId) {
			this.loadExecutionDesignError(false);
			this.executionDesign(null);
			this.isExecutionDesignShown(true);

			try {
				const res = await PathwayService.loadExportDesignByGeneration(executionId);
				this.executionDesign(res);
			} catch (e) {
				this.loadExecutionDesignError(true);
				console.error(e);
			}
		}

		exportLegend(data,event) {
			const tableElement = event.target.parentElement.querySelector('table');
			const filename = `${data.targetCohortName}.png`;
			ChartUtils.downloadElementAsPng(tableElement, filename);
		}

	}

	return commonUtils.build('pathway-results', PathwayResults, view);
});