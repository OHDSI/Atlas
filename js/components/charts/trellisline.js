define([
	'knockout',
	'components/Chart',
	'components/Component',
	'atlascharts',
	'd3',
	'text!components/charts/chart.html',
	'utils/CommonUtils',
	'utils/ChartUtils',
	'const'
], function (
	ko,
	Chart,
	Component,
	atlascharts,
	d3,
	view,
	commonUtils,
	ChartUtils,
	constants
) {
	class Trellisline extends Chart {
		constructor(params, element) {
			super(params, element);
			this.renderer = new atlascharts.trellisline();
		}

		prepareData(rawData) {      
			const trellisData = ChartUtils.normalizeArray(rawData);
			if (!trellisData.empty) {
				const allDeciles = constants.defaultDeciles;
				const minYear = d3.min(trellisData.xCalendarYear),
					maxYear = d3.max(trellisData.xCalendarYear);

				const seriesInitializer = function (tName, sName, x, y) {
					return {
						trellisName: tName,
						seriesName: sName,
						xCalendarYear: x,
						yPrevalence1000Pp: y
					};
				};

				const nestByDecile = d3.nest()
					.key(function (d) {
						return d.trellisName;
					})
					.key(function (d) {
						return d.seriesName;
					})
					.sortValues(function (a, b) {
						return a.xCalendarYear - b.xCalendarYear;
					});

				// map data into chartable form
				const normalizedSeries = trellisData.trellisName.map(function (d, i) {
					const item = {};
					const container = this;
					d3.keys(container).forEach(function (p) {
						item[p] = container[p][i];
					});
					return item;
				}, trellisData);

				const dataByDecile = nestByDecile.entries(normalizedSeries);
				// fill in gaps
				const yearRange = d3.range(minYear, maxYear, 1);
				let yearData = {};

				dataByDecile.forEach(function (trellis) {
					trellis.values.forEach(function (series) {
						series.values = yearRange.map(function (year) {
							yearData = series.values.filter(function (f) {
								return f.xCalendarYear === year;
							})[0] || seriesInitializer(trellis.key, series.key, year, 0);
							yearData.date = new Date(year, 0, 1);
							return yearData;
						});
					});
				});

				return dataByDecile;
			}
			return null;
		}
	}

	return commonUtils.build('trellisline', Trellisline, view);
});
