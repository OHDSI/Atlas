/**
 * Created by juh7007 on 1/7/2016.
 */
define([
    'jquery',
    'd3',
    'knockout',
    'common',
    'reports',
    'jnj_chart',
    'text!./data-sources.html',
		'appConfig',
    'bootstrap',
    'd3_tip',
    'knockout-amd-helpers'
], function ($, d3, ko, common, reports, jnj_chart, view, config) {
	function dataSources(params) {
		var self = this;
		self.model = params.model;
		self.dashboardData = ko.observable();
		self.conditionsData = ko.observable();
		self.personData = ko.observable();
		self.observationPeriodsData = ko.observable();
		self.datasource = ko.observable();
		self.datasources = ko.observableArray();
		self.datasourceReport = ko.observable();
		self.reportView = ko.observable('treemap');
		self.datasourceReports = ko.observableArray([{
				id: 'dashboard',
				name: 'Dashboard'
			},
			{
				id: 'achillesheel',
				name: 'Achilles Heel'
			},
			{
				id: 'person',
				name: 'Person'
			},
			{
				id: 'observationperiods',
				name: 'Observation Periods'
			},
			{
				id: 'datadensity',
				name: 'Data Density'
			},
			{
				id: 'conditions',
				name: 'Conditions'
			},
			{
				id: 'conditioneras',
				name: 'Condition Eras'
			},
			{
				id: 'measurement',
				name: 'Measurement'
			},
			{
				id: 'observations',
				name: 'Observations'
			},
			{
				id: 'drugeras',
				name: 'Drug Eras'
			},
			{
				id: 'drugs',
				name: 'Drug Exposures'
			},
			{
				id: 'procedures',
				name: 'Procedures'
			},
			{
				id: 'visits',
				name: 'Visits'
			},
			{
				id: 'death',
				name: 'Death'
			}
        ]);

		ko.amdTemplateEngine.defaultPath = "/Atlas/js/components/datasources/templates";

		self.formatSI = function (d, p) {
			if (d < 1) {
				return d3.round(d, p);
			}
			var prefix = d3.formatPrefix(d);
			return d3.round(prefix.scale(d), p) + prefix.symbol;
		}

		self.loadDashboard = function () {
			$.ajax({
				type: "GET",
				url: common.getUrlFromData(self.datasource(), "dashboard"),
				contentType: "application/json; charset=utf-8"
			}).done(function (result) {
				result.SUMMARY = common.dataframeToArray(result.SUMMARY);
				result.SUMMARY.forEach(function (d, i, ar) {
					if (!isNaN(d.ATTRIBUTE_VALUE))
						d.ATTRIBUTE_VALUE = self.formatSI(d.ATTRIBUTE_VALUE, 2);
				});
				self.dashboardData(result);
			});
		}

		self.loadObservationPeriods = function () {
			$.ajax({
				type: "GET",
				url: common.getUrlFromData(self.datasource(), "observationperiod"),
				contentType: "application/json; charset=utf-8",
			}).done(function (result) {
				self.observationPeriodsData(result);
			});
		}

		self.loadPerson = function () {
			$.ajax({
				type: "GET",
				url: common.getUrlFromData(self.datasource(), "person"),
				contentType: "application/json; charset=utf-8"
			}).done(function (result) {

				result.SUMMARY = common.dataframeToArray(result.SUMMARY);
				result.SUMMARY.forEach(function (d, i, ar) {
					if (!isNaN(d.ATTRIBUTE_VALUE))
						d.ATTRIBUTE_VALUE = self.formatSI(d.ATTRIBUTE_VALUE, 2);
				});
				self.personData(result);
			});
		}

		self.loadConditions = function (folder) {
			$.ajax({
				type: "GET",
				url: common.getUrlFromData(self.datasource(), "treemap_path"),
				contentType: "application/json; charset=utf-8",
				success: function (data) {
					self.conditionsData(data);
				}
			});
		};

		self.dashboardData.subscribe(function (newData) {
			updateDashboard(newData);
		});

		self.conditionsData.subscribe(function (newData) {
			updateConditions(newData);
		});

		self.personData.subscribe(function (newData) {
			updatePerson(newData);
		});

		self.observationPeriodsData.subscribe(function (newData) {
			updateObservationPeriods(newData);
		});

		$.ajax({
			type: 'GET',
			url: config.dataSourcesLocation,
			contentType: "application/json; charset=utf-8",
			success: function (data) {
				self.datasources(data.datasources);
				var datasources = self.datasources();
				datasource = datasources[0];
				var datasourceReports = self.datasourceReports();
				datasourceReport = datasourceReports[0];

				if (self.datasources().length > 0) {
					self.datasource(datasource);
					self.datasourceReport(datasourceReport);
					self.loadDashboard();
					document.location = '#/datasources/' + datasource.name + '/' + datasourceReport.id;
				}
			}
		});

		self.setDatasource = function (data) {

			self.datasource(data);
			self.loadDashboard();

			document.location = '#/datasources/' + data.name + '/' + self.datasourceReport().id;
			//document.location = '#/datasources/' + data.name + '/dashboard';
		}

		self.setReportView = function (viewName) {
			self.reportView(viewName);
		}

		self.setReport = function (report) {
			self.datasourceReport(report);
			var reportId = report.id;

			if (reportId == 'dashboard')
				self.loadDashboard();
			if (reportId == 'achillesheel')
				reports.AchillesHeel.render(self.datasource());
			if (reportId == 'person')
				self.loadPerson();
			if (reportId == 'observationperiods')
				self.loadObservationPeriods();
			if (reportId == 'datadensity')
				reports.DataDensity.render(self.datasource());
			if (reportId == 'conditions')
				reports.ConditionOccurrence.render(self.datasource());
			self.setReportView('treemap');
			if (reportId == 'conditioneras')
				reports.ConditionEra.render(self.datasource());
			self.setReportView('treemap');
			if (reportId == 'measurement')
				reports.Measurement.render(self.datasource());
			self.setReportView('treemap');
			if (reportId == 'observations')
				reports.Observation.render(self.datasource());
			self.setReportView('treemap');
			if (reportId == 'drugeras')
				reports.DrugEra.render(self.datasource());
			self.setReportView('treemap');
			if (reportId == 'drugs')
				reports.DrugExposure.render(self.datasource());
			self.setReportView('treemap');
			if (reportId == 'procedures')
				reports.ProcedureOccurrence.render(self.datasource());
			self.setReportView('treemap');
			if (reportId == 'visits')
				reports.VisitOccurrence.render(self.datasource());
			self.setReportView('treemap');
			if (reportId == 'death')
				reports.Death.render(self.datasource());
			document.location = '#/datasources/' + self.datasource().name + '/' + reportId;
		}

	}

	function updateDashboard(data) {
		var result = data;

		d3.selectAll("#reportDashboard #genderPie svg").remove();
		genderDonut = new jnj_chart.donut();
		genderDonut.render(common.mapConceptData(result.GENDER_DATA), "#reportDashboard #genderPie", 260, 100, {
			colors: d3.scale.ordinal()
				.domain([8507, 8551, 8532])
				.range(["#1f77b4", " #CCC", "#ff7f0e"]),
			margin: {
				top: 5,
				bottom: 10,
				right: 150,
				left: 10
			}
		});

		d3.selectAll("#reportDashboard #ageatfirstobservation svg").remove();
		var ageAtFirstObservationData = common.mapHistogram(result.AGE_AT_FIRST_OBSERVATION_HISTOGRAM)
		var ageAtFirstObservationHistogram = new jnj_chart.histogram();
		ageAtFirstObservationHistogram.render(ageAtFirstObservationData, "#reportDashboard #ageatfirstobservation", 460, 195, {
			xFormat: d3.format('d'),
			xLabel: 'Age',
			yLabel: 'People'
		});

		d3.selectAll("#reportDashboard #cumulativeobservation svg").remove();
		var cumulativeObservationLine = new jnj_chart.line();
		var cumulativeData = common.normalizeDataframe(result.CUMULATIVE_DURATION).X_LENGTH_OF_OBSERVATION
			.map(function (d, i) {
				var item = {
					xValue: this.X_LENGTH_OF_OBSERVATION[i],
					yValue: this.Y_PERCENT_PERSONS[i]
				};
				return item;
			}, result.CUMULATIVE_DURATION);

		var cumulativeObservationXLabel = 'Days';
		if (cumulativeData.length > 0) {
			if (cumulativeData.slice(-1)[0].xValue - cumulativeData[0].xValue > 1000) {
				// convert x data to years
				cumulativeData.forEach(function (d) {
					d.xValue = d.xValue / 365.25;
				});
				cumulativeObservationXLabel = 'Years';
			}

			cumulativeObservationLine.render(cumulativeData, "#reportDashboard #cumulativeobservation", 550, 300, {
				yFormat: d3.format('0%'),
				interpolate: "step-before",
				xLabel: cumulativeObservationXLabel,
				yLabel: 'Percent of Population'
			});
		}

		var byMonthSeries = common.mapMonthYearDataToSeries(result.OBSERVED_BY_MONTH, {
			dateField: 'MONTH_YEAR',
			yValue: 'COUNT_VALUE',
			yPercent: 'PERCENT_VALUE'
		});

		d3.selectAll("#reportDashboard #oppeoplebymonthsingle svg").remove();
		var observationByMonthSingle = new jnj_chart.line();
		observationByMonthSingle.render(byMonthSeries, "#reportDashboard #oppeoplebymonthsingle", 550, 300, {
			xScale: d3.time.scale().domain(d3.extent(byMonthSeries[0].values, function (d) {
				return d.xValue;
			})),
			xFormat: d3.time.format("%m/%Y"),
			tickFormat: d3.time.format("%Y"),
			tickPadding: 10,
			xLabel: "Date",
			yLabel: "People"
		});
	}

	function updateObservationPeriods(data) {
		var result = data;

		d3.selectAll("#reportObservationPeriods #agebygender svg").remove();
		var agegenderboxplot = new jnj_chart.boxplot();
		var agData = result.AGE_BY_GENDER.CATEGORY
			.map(function (d, i) {
				var item = {
					Category: this.CATEGORY[i],
					min: this.MIN_VALUE[i],
					LIF: this.P10_VALUE[i],
					q1: this.P25_VALUE[i],
					median: this.MEDIAN_VALUE[i],
					q3: this.P75_VALUE[i],
					UIF: this.P90_VALUE[i],
					max: this.MAX_VALUE[i]
				};
				return item;
			}, result.AGE_BY_GENDER);
		agegenderboxplot.render(agData, "#reportObservationPeriods #agebygender", 235, 210, {
			xLabel: "Gender",
			yLabel: "Age"
		});

		d3.selectAll("#reportObservationPeriods #ageatfirstobservation svg").remove();
		var ageAtFirstObservationData = common.mapHistogram(result.AGE_AT_FIRST_OBSERVATION_HISTOGRAM);
		var ageAtFirstObservationHistogram = new jnj_chart.histogram();
		ageAtFirstObservationHistogram.render(ageAtFirstObservationData, "#reportObservationPeriods #ageatfirstobservation", 460, 195, {
			xFormat: d3.format('d'),
			xLabel: 'Age',
			yLabel: 'People'
		});

		d3.selectAll("#reportObservationPeriods #observationlength svg").remove();
		result.OBSERVATION_LENGTH_HISTOGRAM.DATA = common.normalizeDataframe(result.OBSERVATION_LENGTH_HISTOGRAM.DATA)
		var observationLengthData = common.mapHistogram(result.OBSERVATION_LENGTH_HISTOGRAM);
		var observationLengthXLabel = 'Days';
		if (observationLengthData.length > 0) {
			if (observationLengthData[observationLengthData.length - 1].x - observationLengthData[0].x > 1000) {
				observationLengthData.forEach(function (d) {
					d.x = d.x / 365.25;
					d.dx = d.dx / 365.25;
				});
				observationLengthXLabel = 'Years';
			}
		}
		var observationLengthHistogram = new jnj_chart.histogram();
		observationLengthHistogram.render(observationLengthData, "#reportObservationPeriods #observationlength", 460, 195, {
			xLabel: observationLengthXLabel,
			yLabel: 'People'
		});


		d3.selectAll("#reportObservationPeriods #cumulativeobservation svg").remove();
		var cumulativeObservationLine = new jnj_chart.line();
		var cumulativeData = common.normalizeDataframe(result.CUMULATIVE_DURATION).X_LENGTH_OF_OBSERVATION
			.map(function (d, i) {
				var item = {
					xValue: this.X_LENGTH_OF_OBSERVATION[i],
					yValue: this.Y_PERCENT_PERSONS[i]
				};
				return item;
			}, result.CUMULATIVE_DURATION);

		var cumulativeObservationXLabel = 'Days';
		if (cumulativeData.length > 0) {
			if (cumulativeData.slice(-1)[0].xValue - cumulativeData[0].xValue > 1000) {
				// convert x data to years
				cumulativeData.forEach(function (d) {
					d.xValue = d.xValue / 365.25;
				});
				cumulativeObservationXLabel = 'Years';
			}
		}

		cumulativeObservationLine.render(cumulativeData, "#reportObservationPeriods #cumulativeobservation", 450, 260, {
			yFormat: d3.format('0%'),
			interpolate: "step-before",
			xLabel: cumulativeObservationXLabel,
			yLabel: 'Percent of Population'
		});

		d3.selectAll("#reportObservationPeriods #opbygender svg").remove();
		var opbygenderboxplot = new jnj_chart.boxplot();
		result.OBSERVATION_PERIOD_LENGTH_BY_GENDER = common.normalizeDataframe(result.OBSERVATION_PERIOD_LENGTH_BY_GENDER);
		var opgData = result.OBSERVATION_PERIOD_LENGTH_BY_GENDER.CATEGORY
			.map(function (d, i) {
				var item = {
					Category: this.CATEGORY[i],
					min: this.MIN_VALUE[i],
					LIF: this.P10_VALUE[i],
					q1: this.P25_VALUE[i],
					median: this.MEDIAN_VALUE[i],
					q3: this.P75_VALUE[i],
					UIF: this.P90_VALUE[i],
					max: this.MAX_VALUE[i]
				};
				return item;
			}, result.OBSERVATION_PERIOD_LENGTH_BY_GENDER);

		var opgDataYlabel = 'Days';
		var opgDataMinY = d3.min(opgData, function (d) {
			return d.min;
		});
		var opgDataMaxY = d3.max(opgData, function (d) {
			return d.max;
		});
		if ((opgDataMaxY - opgDataMinY) > 1000) {
			opgData.forEach(function (d) {
				d.min = d.min / 365.25;
				d.LIF = d.LIF / 365.25;
				d.q1 = d.q1 / 365.25;
				d.median = d.median / 365.25;
				d.q3 = d.q3 / 365.25;
				d.UIF = d.UIF / 365.25;
				d.max = d.max / 365.25;
			});
			opgDataYlabel = 'Years';
		}

		opbygenderboxplot.render(opgData, "#reportObservationPeriods #opbygender", 235, 210, {
			xLabel: 'Gender',
			yLabel: opgDataYlabel
		});

		d3.selectAll("#reportObservationPeriods #opbyage svg").remove();
		var opbyageboxplot = new jnj_chart.boxplot();
		result.OBSERVATION_PERIOD_LENGTH_BY_AGE = common.normalizeDataframe(result.OBSERVATION_PERIOD_LENGTH_BY_AGE);
		var opaData = result.OBSERVATION_PERIOD_LENGTH_BY_AGE.CATEGORY
			.map(function (d, i) {
				var item = {
					Category: this.CATEGORY[i],
					min: this.MIN_VALUE[i],
					LIF: this.P10_VALUE[i],
					q1: this.P25_VALUE[i],
					median: this.MEDIAN_VALUE[i],
					q3: this.P75_VALUE[i],
					UIF: this.P90_VALUE[i],
					max: this.MAX_VALUE[i]
				};
				return item;
			}, result.OBSERVATION_PERIOD_LENGTH_BY_AGE);

		var opaDataYlabel = 'Days';
		var opaDataMinY = d3.min(opaData, function (d) {
			return d.min;
		});
		var opaDataMaxY = d3.max(opaData, function (d) {
			return d.max;
		});
		if ((opaDataMaxY - opaDataMinY) > 1000) {
			opaData.forEach(function (d) {
				d.min = d.min / 365.25;
				d.LIF = d.LIF / 365.25;
				d.q1 = d.q1 / 365.25;
				d.median = d.median / 365.25;
				d.q3 = d.q3 / 365.25;
				d.UIF = d.UIF / 365.25;
				d.max = d.max / 365.25;
			});
			opaDataYlabel = 'Years';
		}

		opbyageboxplot.render(opaData, "#reportObservationPeriods #opbyage", 450, 260, {
			xLabel: 'Age Decile',
			yLabel: opaDataYlabel
		});

		d3.selectAll("#reportObservationPeriods #oppeoplebyyear svg").remove();
		var observationLengthHistogram = new jnj_chart.histogram();
		observationLengthHistogram.render(common.mapHistogram(result.OBSERVED_BY_YEAR_HISTOGRAM), "#reportObservationPeriods #oppeoplebyyear", 460, 195, {
			xFormat: d3.format('d'),
			xLabel: 'Year',
			yLabel: 'People'
		});

		var byMonthSeries = common.mapMonthYearDataToSeries(result.OBSERVED_BY_MONTH, {
			dateField: 'MONTH_YEAR',
			yValue: 'COUNT_VALUE',
			yPercent: 'PERCENT_VALUE'
		});

		d3.selectAll("#reportObservationPeriods #oppeoplebymonthsingle svg").remove();
		var observationByMonthSingle = new jnj_chart.line();
		observationByMonthSingle.render(byMonthSeries, "#reportObservationPeriods #oppeoplebymonthsingle", 900, 250, {
			xScale: d3.time.scale().domain(d3.extent(byMonthSeries[0].values, function (d) {
				return d.xValue;
			})),
			xFormat: d3.time.format("%m/%Y"),
			tickFormat: d3.time.format("%Y"),
			ticks: 10,
			xLabel: "Date",
			yLabel: "People"
		});

		d3.selectAll("#reportObservationPeriods #opperperson svg").remove();
		raceDonut = new jnj_chart.donut();
		raceDonut.render(common.mapConceptData(result.PERSON_PERIODS_DATA), "#reportObservationPeriods #opperperson", 255, 230, {
			margin: {
				top: 5,
				bottom: 10,
				right: 50,
				left: 10
			}
		});
	}

	function updatePerson(data) {
		var result = data;

		d3.selectAll("#reportPerson #genderPie svg").remove();
		genderDonut = new jnj_chart.donut();
		genderDonut.render(common.mapConceptData(result.GENDER_DATA), "#reportPerson #genderPie", 260, 130, {
			colors: d3.scale.ordinal()
				.domain([8507, 8551, 8532])
				.range(["#1f77b4", " #CCC", "#ff7f0e"]),
			margin: {
				top: 5,
				bottom: 10,
				right: 150,
				left: 10
			}

		});

		d3.selectAll("#reportPerson #raceTypePie svg").remove();
		raceDonut = new jnj_chart.donut();
		raceDonut.render(common.mapConceptData(result.RACE_DATA), "#reportPerson #raceTypePie", 260, 130, {
			margin: {
				top: 5,
				bottom: 10,
				right: 150,
				left: 10
			}
		});

		d3.selectAll("#reportPerson #ethnicityTypePie svg").remove();
		raceDonut = new jnj_chart.donut();
		raceDonut.render(common.mapConceptData(result.ETHNICITY_DATA), "#reportPerson #ethnicityTypePie", 260, 130, {
			margin: {
				top: 5,
				bottom: 10,
				right: 150,
				left: 10
			}
		});

		d3.selectAll("#reportPerson #birthyearhist svg").remove();
		var yearHistogram = new jnj_chart.histogram();
		yearHistogram.render(common.mapHistogram(result.BIRTH_YEAR_HISTOGRAM), "#reportPerson #birthyearhist", 460, 195, {
			xFormat: d3.format('d'),
			xLabel: 'Year',
			yLabel: 'People'
		});


	}

	var component = {
		viewModel: dataSources,
		template: view
	};

	ko.components.register('data-sources', component);
	return component;

});