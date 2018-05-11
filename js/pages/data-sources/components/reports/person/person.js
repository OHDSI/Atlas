define([
	'knockout',
	'text!./person.html',
	'd3',
  'services/http',
  'pages/data-sources/const',
  'pages/data-sources/classes/Report',
  'pages/data-sources/components/report-title/report-title',
  'pages/data-sources/components/charts/histogram',
  'pages/data-sources/components/charts/line',
	'less!./person.less'
], function (
	ko,
	view,
	d3,
  httpService,
  helpers,
  Report
) {
	class Person extends Report {
    constructor() {
      super();
      this.name = 'person';
      this.view = view;
      
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

    }

    render(params) {
      super.render(params);
      
      this.getData()
        .then(({ data }) => {
          if (data.yearOfBirth.length > 0 && data.yearOfBirthStats.length > 0) {
            var histData = {};
            histData.intervalSize = 1;
            histData.min = data.yearOfBirthStats[0].minValue;
            histData.max = data.yearOfBirthStats[0].maxValue;
            histData.intervals = 100;
            histData.data = (helpers.normalizeArray(data.yearOfBirth));
            this.yearHistogramData(helpers.mapHistogram(histData));
          }

          this.genderData(helpers.mapConceptData(data.gender));
          this.raceData(helpers.mapConceptData(data.race));
          this.ethnicityData(helpers.mapConceptData(data.ethnicity));
        });

        return this;
    }
  }

  const report = new Person();	
	return report.build();
});
