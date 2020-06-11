define([
	'knockout',
	'components/Component',
	'utils/AutoBind',
	'utils/CommonUtils',
	'text!./pathway-tableview.html',	
	'less!./pathway-tableview.less',
	'databindings'
], function (
	ko,
	Component,
	AutoBind,
	commonUtils,
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

	function columnValueBuilder (label, field, formatter) {
		return {
			title: label,
			data: (d) => formatter ? formatter(d[field]) : d[field],
			defaultContent: ''
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
					return {
						id: c.id, 
						name: c.name, 
						cohortCount: pathwayGroup.targetCohortCount, 
						pathwayCount: pathwayGroup.totalPathwaysCount,
						pathways: pathwayGroup.pathways
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
		
		getPathwayGroupData(pathways, pathLength)
		{
			let data = pathways.map(p => ({
				path : p.path.split('-',pathLength)
					.map(p => +p)																		
					.concat(Array(MAX_PATH_LENGTH).fill(null))
					.slice(0,pathLength),
				personCount: p.personCount
			}));

			let groups = data.reduce((acc,cur) => {
				const key = JSON.stringify(cur.path);
				if (!acc.has(key)) {
					acc.set(key, cur);
				} else {
					acc.get(key).personCount += cur.personCount;
				}
				return acc;
			}, new Map()).values();

			return Array.from(groups);
		}	
		
		getDataTableBindingData(pathwayGroup) {
			// 'data' is based on a group-by sum of the specified path lengths

			let pathCols = Array(MAX_PATH_LENGTH)
				.fill()
				.map((v,i) => {
					const col = columnPathBuilder(`Step ${i+1}`, i, this.pathCodeResolver);
					col.visible = i < this.pathLength();
					return col;
				});					
			let statCols = [columnValueBuilder("Count", "personCount")];
			let data = this.getPathwayGroupData(pathwayGroup.pathways, this.pathLength());

			// add columns for % of Paths and % of cohort
			data.forEach(row => {
				row.pathwayPercent = 100.0 * row.personCount / pathwayGroup.pathwayCount;
				row.cohortPercent = 100.0 * row.personCount / pathwayGroup.cohortCount;
			});

			statCols.push(columnValueBuilder("% with Pathway", "pathwayPercent", percentFormat));
			statCols.push(columnValueBuilder("% of Cohort", "cohortPercent", percentFormat));

			return {
				data: data, //data,
				options: {
					autoWidth:true,
					order: [[pathCols.length, 'desc']],
					columnDefs: statCols.map((c,i) => ({width: "7%", targets: pathCols.length + i, className: 'stat'})),
					columns :  [...pathCols, ...statCols]
				}
			}
		}
		
		exportCohortReport(d) {
			const rawData = this.getPathwayGroupData(d.pathways, this.pathLength());
			const csvData = rawData.map(row => {
				const newRow = {};
				row.path.forEach((p,i) => {
					newRow[`Step ${i + 1}`] = this.pathCodeResolver(p);
				});
				newRow['personCount'] = row.personCount;
				newRow['pathwayPercent'] = percentFormat(100.0 * row.personCount / d.pathwayCount);
				newRow['cohortPercent'] = percentFormat(100.0 * row.personCount / d.cohortCount);

				return newRow;
			});
			csvData.sort((a,b) => b.personCount - a.personCount);
			CsvUtils.saveAsCsv(csvData);
		}

	}
	
	return commonUtils.build('pathway-tableview', PathwayTableview, view);
});