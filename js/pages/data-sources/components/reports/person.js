define([
	'knockout',
	'text!./person.html',
	'd3',
    'atlascharts',
    'utils/CommonUtils',
	'utils/ChartUtils',
	'components/reports/classes/Report',
	'components/Component',
	'components/heading',
	'components/charts/histogram',
	'components/charts/donut',
	'less!./person.less',
], function (
	ko,
	view,
	d3,
    atlascharts,
    commonUtils,
	ChartUtils,
	Report,
	Component
) {
	class Person extends Report {
		constructor(params) {
			super(params);
			this.name = 'Person';
			this.yearHistogramData = ko.observable();
			this.genderData = ko.observable();
			this.raceData = ko.observable();
			this.ethnicityData = ko.observable();
			this.chartFormats = {
				yearHistogram: {
					xFormat: d3.format('d'),
					yFormat: d3.format(',.1s'),
					xLabel: ko.i18n('dataSources.personReport.year', 'Year'),
					yLabel: ko.i18n('dataSources.personReport.numberOfPersons', '# of Persons'),
					xValue: 'x',
					yValue: 'y',
					getTooltipBuilder: options => d => {
						const format = d3.format('');
						return `
							${options.xLabel}: ${options.xFormat(d[options.xValue])}<br/>
							${options.yLabel}: ${d3.format(',')(d[options.yValue])}
						`;
					},
				},
			};

			this.loadData();
		}

		parseData({ data }) {
			if (data.yearOfBirth.length > 0 && data.yearOfBirthStats.length > 0) {
				var histData = {};
				histData.INTERVAL_SIZE = 1;
				histData.OFFSET = data.yearOfBirthStats[0].minValue;
				let mappedHistData = data.yearOfBirth.map(each => ({ INTERVAL_INDEX: each.intervalIndex, COUNT_VALUE: each.countValue }));
				histData.DATA = ChartUtils.normalizeArray(mappedHistData);
				histData.INTERVALS = data.yearOfBirth.length;
				this.yearHistogramData(atlascharts.histogram.mapHistogram(histData));
			}

			this.genderData(ChartUtils.mapConceptData(data.gender));
			this.raceData(ChartUtils.mapConceptData(data.race));
			this.ethnicityData(ChartUtils.mapConceptData(data.ethnicity));

		}
	}

	return commonUtils.build('report-person', Person, view);
});
