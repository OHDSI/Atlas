define([
	'knockout',
	'components/Component',
	'utils/AutoBind',
	'utils/CommonUtils',
	'utils/CsvUtils',
	'text!./pathway-tableview.html',	
	'less!./pathway-tableview.less',
	'databindings'
], function (
	ko,
	Component,
	AutoBind,
	CommonUtils,
	CsvUtils,
	view
) {
	
	const MAX_PATH_LENGTH = 10;
	const DEFAULT_PATH_LENGTH = 5;
	const PATH_LENGTH_OPTIONS = Array(MAX_PATH_LENGTH).fill().map((v,i)=>i + 1);
	
	function columnPathBuilder (label, field, resolver) {
		return {
			title: label,
			data: (d) => resolver ? resolver(d.path[field]) : d.paths[field],
			defaultContent: ''
		};
	}

	function columnValueBuilder (label, field, formatter, width) {
		return {
			title: label,
			data: (d) => formatter ? formatter(d[field]) : d[field] + "", // had to append '' because 0 value was not printing.
			defaultContent: '',
			width: width || '10%'
		};
	}

	function percentFormat(v) {
		return `${v.toFixed(2)}%`;
	}
	
	class PathwayTableview extends AutoBind(Component) {
		constructor(params) {
			super();
			this.results = params.results;
			this.filterList = ko.utils.unwrapObservable(params.filterList);
			this.pathLengthOptions = PATH_LENGTH_OPTIONS;
			this.pathLength = ko.observable(DEFAULT_PATH_LENGTH);
			this.reportData = ko.pureComputed(() => this.prepareReportData());
		}
		
		prepareReportData() {
			const design = this.results.design;
			const pathwayGroups = this.results.data.pathwayGroups;
			return({
				cohorts: design.targetCohorts.filter(c => this.filterList.selectedValues().includes(c.id)).map(c => {
					
					const pathwayGroup = pathwayGroups.find(p => p.targetCohortId == c.id);
					if (pathwayGroup) {
						return {
							id: c.id, 
							name: c.name, 
							cohortCount: pathwayGroup.targetCohortCount, 
							pathwayCount: pathwayGroup.totalPathwaysCount,
							pathways: pathwayGroup.pathways.map(p => ({ // split pathway paths into paths and counts
								path : p.path.split('-')
									.filter(step => step != "end") // remove end markers from pathway
									.map(p => +p)
									.concat(Array(MAX_PATH_LENGTH).fill(null)) // pad end of paths to be at least MAX_PATH_LENGTH
									.slice(0,MAX_PATH_LENGTH), // limit path to MAX_PATH_LENGTH.
								personCount: p.personCount
							}))
						}
					} else {
						return null;
					}
				}),
				eventCodes: this.results.data.eventCodes
			});		
		}
		
		pathCodeResolver(d) {
			return this.reportData().eventCodes
				.filter(ec => ec.isCombo == false && (ec.code & d) > 0)
				.map(ec => ec.name)
				.join(' + ');
		}
		
		getPathwayGroupData(pathwayGroup, pathLength)
		{
			let groups = pathwayGroup.pathways.reduce((acc,cur) => { // reduce pathways into a list of paths with counts
				const key = JSON.stringify(cur.path.slice(0,pathLength));
				if (!acc.has(key)) {
					acc.set(key, {personCount: cur.personCount, path: cur.path});
				} else {
					acc.get(key).personCount += cur.personCount;
				}
				return acc;
			}, new Map()).values();

			const data = Array.from(groups)
			data.forEach(row => { // add pathway and cohort percents
				row.pathwayPercent = 100.0 * row.personCount / pathwayGroup.pathwayCount;
				row.cohortPercent = 100.0 * row.personCount / pathwayGroup.cohortCount;
			});
			return data;
		}	
		
		getPathwayGroupDatatable(pathwayGroup, pathLength) {
			let pathCols = Array(MAX_PATH_LENGTH)
				.fill()
				.map((v,i) => {
					const colName = ko.i18nformat('pathways.manager.executions.results.tableview.stepN', 'Step <%=i%>', {i: i+1});
					const col = columnPathBuilder(ko.unwrap(colName), i, this.pathCodeResolver);
					col.visible = i < pathLength;
					return col;
				});					
			let statCols = [columnValueBuilder(ko.i18n('columns.count', 'Count')(), "personCount")];
			let data = pathwayGroup ? this.getPathwayGroupData(pathwayGroup, pathLength) : [];

			statCols.push(columnValueBuilder(ko.i18n('columns.pctWithPathway', '% with Pathway')(), "pathwayPercent", percentFormat));
			statCols.push(columnValueBuilder(ko.i18n('columns.pctOfCohort', '% of Cohort')(), "cohortPercent", percentFormat));

			return {
				data: data,
				options: {
					order: [[pathCols.length, 'desc']],
					columnDefs: statCols.map((c,i) => ({targets: pathCols.length + i, className: 'stat'})),
					columns :  [...pathCols, ...statCols],
					language: ko.i18n('datatable.language')
				}
			}
		}
		
		exportPathwayReport(pathwayGroup) {
			const rawData = this.getPathwayGroupData(pathwayGroup, this.pathLength());
			const csvData = rawData.map(row => {
				const newRow = {};
				newRow['sourceName'] = this.results.sourceName;
				newRow['targetId'] = pathwayGroup.id;
				newRow['targetname'] = pathwayGroup.name;
				newRow['cohortCount'] = pathwayGroup.cohortCount;
				newRow['pathwayCount'] = pathwayGroup.pathwayCount;
				row.path.forEach((p,i) => {
					newRow[`Step ${i + 1}`] = this.pathCodeResolver(p);
				});
				newRow['personCount'] = row.personCount;
				newRow['pathwayPercent'] = percentFormat(row.pathwayPercent);
				newRow['cohortPercent'] = percentFormat(row.cohortPercent);

				return newRow;
			});
			csvData.sort((a,b) => b.personCount - a.personCount);
			CsvUtils.saveAsCsv(csvData,`${this.results.executionId}_${pathwayGroup.id}_pathways.csv`);
		}
		
		getEventCohortsByRank(pathwayGroup)
		{
			if (!pathwayGroup) return []; // default to empty data

			const pathways = pathwayGroup.pathways;
			const eventCodes = this.reportData().eventCodes;
			let groups = pathways.reduce((acc,cur) => { // reduce pathways an Array of ranks containing a Map of counts by event cohort
				for (let i = 0; i < cur.path.length; i++) {
					acc[i] = acc[i] || new Map(); // allocate a map for this rank if index is missing
					eventCodes.filter(ec => ec.isCombo == false && (ec.code & cur.path[i]) > 0).forEach(ec => {
						if (!acc[i].has(ec.code)) {
							acc[i].set(ec.code, {code: ec.code, rank: i+1, personCount : cur.personCount}); // copy out to new object to avoid pollution of main data object
						} else {
							acc[i].get(ec.code).personCount += cur.personCount;								
						}
					});
				}
				return acc;
			}, new Array(10));
			
			const data = groups.reduce((acc,cur) => {
				return acc.concat(Array.from(cur.values()));
			},[]);
			
			data.forEach(row => { // add pathway and cohort percents
				row.pathwayPercent = 100.0 * row.personCount / pathwayGroup.pathwayCount;
				row.cohortPercent = 100.0 * row.personCount / pathwayGroup.cohortCount;
			});
			
			return data;
			
		}
		
		getEventCohortByRankDatatable(pathwayGroup) {
			let data = this.getEventCohortsByRank(pathwayGroup);

			return {
				data: data,
				options: {
					order: [[2, 'desc']],
					columns : [
						columnValueBuilder(ko.i18n('columns.eventCohort', 'Event Cohort'), "code", this.pathCodeResolver, '60%'),
						columnValueBuilder(ko.i18n('columns.rank', 'Rank'), "rank"),
						columnValueBuilder(ko.i18n('columns.Count', 'Count'), "personCount"),
						columnValueBuilder(ko.i18n('columns.pctWithPathway', '% with Pathway'), "pathwayPercent", percentFormat),
						columnValueBuilder(ko.i18n('columns.pctOfCohort', '% of Cohort'), "cohortPercent", percentFormat)
					],
					language: ko.i18n('datatable.language')
				}
			}
		}
		
		exportCountsByRank(pathwayGroup) {
			const rawData = this.getEventCohortsByRank(pathwayGroup);
			const csvData = rawData.map(row => {
				const newRow = {};				
				newRow['sourceName'] = this.results.sourceName;
				newRow['targetId'] = pathwayGroup.id;
				newRow['targetname'] = pathwayGroup.name;
				newRow['cohortCount'] = pathwayGroup.cohortCount;
				newRow['pathwayCount'] = pathwayGroup.pathwayCount;
				newRow['eventCohort'] = this.pathCodeResolver(row.code);
				newRow['rank'] = row.rank;
				newRow['personCount'] = row.personCount;
				newRow['pathwayPercent']=percentFormat(row.pathwayPercent);
				newRow['cohortPercent']=percentFormat(row.cohortPercent);
				return newRow;
			})
		
			csvData.sort((a,b) => b.personCount - a.personCount);
			CsvUtils.saveAsCsv(csvData,`${this.results.executionId}_${pathwayGroup.id}_EventCohortsByRank.csv`);
		}
		
		getEventCohortCounts(pathwayGroup)
		{
			if (!pathwayGroup) return []; // default to empty data
			const pathways = pathwayGroup.pathways;
			const eventCodes = this.reportData().eventCodes;
			let dataMap = pathways.reduce((acc,cur) => { // reduce pathways an Array of ranks containing a Map of counts by event cohort
				const visited = new Map();
				for (let i = 0; i < cur.path.length; i++) {
					eventCodes.filter(ec => ec.isCombo == false && (ec.code & cur.path[i]) > 0).forEach(ec => {
						if (visited.has(ec.code)) return; // do not add this event cohort to the total if the event cohort has already been seen in this path
						visited.set(ec.code, true);
						if (!acc.has(ec.code)) {
							acc.set(ec.code, {code: ec.code, personCount : cur.personCount}); // copy out to new object to avoid pollution of main data object
						} else {
							acc.get(ec.code).personCount += cur.personCount;								
						}
					});
				}
				return acc;
			}, new Map());
			
			const data = Array.from(Array.from(dataMap.values()));
			
			data.forEach(row => { // add pathway and cohort percents
				row.pathwayPercent = 100.0 * row.personCount / pathwayGroup.pathwayCount;
				row.cohortPercent = 100.0 * row.personCount / pathwayGroup.cohortCount;
			});
			return data;			
		}
		
		getEventCohortCountsDatatable(pathwayGroup) {
			let data = this.getEventCohortCounts(pathwayGroup);

			return {
				data: data,
				options: {
					order: [[1, 'desc']],
					columns : [
						columnValueBuilder(ko.i18n('columns.eventCohort', 'Event Cohort'), "code", this.pathCodeResolver, '70%'),
						columnValueBuilder(ko.i18n('columns.Count', 'Count'), "personCount"),
						columnValueBuilder(ko.i18n('columns.pctWithPathway', '% with Pathway'), "pathwayPercent", percentFormat),
						columnValueBuilder(ko.i18n('columns.pctOfCohort', '% of Cohort'), "cohortPercent", percentFormat)
					],
					language: ko.i18n('datatable.language')
				}
			}
		}
		
		exportEventCohortCounts(pathwayGroup) {
			const rawData = this.getEventCohortCounts(pathwayGroup);
			const csvData = rawData.map(row => {
				const newRow = {};				
				newRow['sourceName'] = this.results.sourceName;
				newRow['targetId'] = pathwayGroup.id;
				newRow['targetname'] = pathwayGroup.name;
				newRow['cohortCount'] = pathwayGroup.cohortCount;
				newRow['pathwayCount'] = pathwayGroup.pathwayCount;
				newRow['eventCohort'] = this.pathCodeResolver(row.code);
				newRow['personCount'] = row.personCount;
				newRow['pathwayPercent']=percentFormat(row.pathwayPercent);
				newRow['cohortPercent']=percentFormat(row.cohortPercent);
				return newRow;
			})
		
			csvData.sort((a,b) => b.personCount - a.personCount);
			CsvUtils.saveAsCsv(csvData,`${this.results.executionId}_${pathwayGroup.id}_EventCohortCounts.csv`);
		}
		
		getDistinctEventCohortCounts(pathwayGroup)
		{
			if (!pathwayGroup) return []; // default to empty data

			const pathways = pathwayGroup.pathways;
			let dataMap = pathways.reduce((acc,cur) => { // reduce pathways an Array of ranks containing a Map of counts by comboId
				const visited = new Map();
				for (let i = 0; i < cur.path.length; i++) {
					const comboId = cur.path[i];
					if (comboId != null && !visited.has(comboId)) visited.set(comboId, true); // add new comboIds to path set, paths can contain null
				}
				
				const eventCohorts = Array.from(visited.keys()); // keys() = distinct comboIDs in path
				
				if (!acc.has(eventCohorts.length)) {
					acc.set(eventCohorts.length, {eventCohorts: eventCohorts.length, personCount : cur.personCount}); // copy out to new object to avoid pollution of main data object
				} else {
					acc.get(eventCohorts.length).personCount += cur.personCount;								
				}
				
				return acc;
			}, new Map());
			
			const data = Array.from(dataMap.values());
			
			data.forEach(row => { // add pathway and cohort percents
				row.pathwayPercent = 100.0 * row.personCount / pathwayGroup.pathwayCount;
				row.cohortPercent = 100.0 * row.personCount / pathwayGroup.cohortCount;
			});

			// add the zero-case to result
			data.push({
				eventCohorts: 0,
				personCount: (pathwayGroup.cohortCount - pathwayGroup.pathwayCount),
				pathwayPercent: 0,
				cohortPercent: 100.0 * (pathwayGroup.cohortCount - pathwayGroup.pathwayCount) / pathwayGroup.cohortCount
			});

			return data;
		}
		
		getDistinctEventCohortCountsDatatable(pathwayGroup) {
			let data = this.getDistinctEventCohortCounts(pathwayGroup);

			return {
				data: data,
				options: {
					order: [[1, 'desc']],
					columns : [
						columnValueBuilder(ko.i18n('columns.distinctEventCohorts', 'Distinct Event Cohorts'), "eventCohorts", (v) => ko.i18nformat('pathways.manager.executions.results.tableview.exactly', 'Exactly <%=v%>', {v: v})(), '70%'),
						columnValueBuilder(ko.i18n('columns.count', 'Count'), "personCount"),
						columnValueBuilder(ko.i18n('columns.pctWithPathway', '% with Pathway'), "pathwayPercent", percentFormat),
						columnValueBuilder(ko.i18n('columns.pctOfCohort', '% of Cohort'), "cohortPercent", percentFormat)
					],
					language: ko.i18n('datatable.language')
				}
			}
		}		
		
		exportDistinctEventCohortCounts(pathwayGroup) {
			const rawData = this.getDistinctEventCohortCounts(pathwayGroup);
			const csvData = rawData.map(row => {
				const newRow = {};				
				newRow['sourceName'] = this.results.sourceName;
				newRow['targetId'] = pathwayGroup.id;
				newRow['targetname'] = pathwayGroup.name;
				newRow['cohortCount'] = pathwayGroup.cohortCount;
				newRow['pathwayCount'] = pathwayGroup.pathwayCount;
				newRow['eventCohorts'] = `Exactly ${row.eventCohorts}`;
				newRow['personCount'] = row.personCount;
				newRow['pathwayPercent']=percentFormat(row.pathwayPercent);
				newRow['cohortPercent']=percentFormat(row.cohortPercent);
				return newRow;
			})
		
			csvData.sort((a,b) => b.personCount - a.personCount);
			CsvUtils.saveAsCsv(csvData,`${this.results.executionId}_${pathwayGroup.id}_DistinctEventCohorts.csv`);
		}		
		
	}
	
	return CommonUtils.build('pathway-tableview', PathwayTableview, view);
});
