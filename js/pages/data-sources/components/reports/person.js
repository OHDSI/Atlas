define([
	'knockout',
	'text!./person.html',
	'd3',
	'utils/CommonUtils',
	'pages/data-sources/classes/Report',
	'providers/Component',
	'components/heading',
	'components/charts/histogram',
	'components/charts/donut',
], function (
	ko,
	view,
	d3,
	commonUtils,
	Report,
	Component
) {
	class Person extends Report {
		constructor(params) {
			super(params);
			
			this.yearHistogramData = ko.observable();
			this.genderData = ko.observable();
			this.raceData = ko.observable();
			this.ethnicityData = ko.observable();

			this.chartFormats = {
				yearHistogram: {
					xFormat: d3.format('d'),
					yFormat: d3.format(',.1s'),
					xLabel: 'Year',
					yLabel: 'People',
				},        
			};
			
			this.getData().then(rawData => this.parseData(rawData));
		}

		parseData({ data }) {
			if (data.yearOfBirth.length > 0 && data.yearOfBirthStats.length > 0) {
				var histData = {};
				histData.intervalSize = 1;
				histData.min = data.yearOfBirthStats[0].minValue;
				histData.max = data.yearOfBirthStats[0].maxValue;
				histData.intervals = 100;
				histData.data = (commonUtils.normalizeArray(data.yearOfBirth));
				this.yearHistogramData(commonUtils.mapHistogram(histData));
			}

			this.genderData(commonUtils.mapConceptData(data.gender));
			this.raceData(commonUtils.mapConceptData(data.race));
			this.ethnicityData(commonUtils.mapConceptData(data.ethnicity));

		}
	}

	return commonUtils.build('person', Person, view);
});
