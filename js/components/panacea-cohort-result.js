define(['knockout', 'text!./panacea-cohort-result.html', 'jquery', 'd3', 'appConfig', 'cohortbuilder/CohortDefinition', 'jnj_chart', 'lodash' 
        ,'cohortdefinitionviewer'
        ,'knockout.dataTables.binding'
        ,'faceted-datatable'
        ,'databindings'
], function (ko, view, $, d3, config, CohortDefinition, jnj_chart, _) {
	function panaceaCohortResult(params) {
		var self = this;
		self.model = params.model;
		self.services = params.services;
		self.resultMode = params.resultMode;
//		self.panaceaResultStudyId = ko.observable(params.panaceaResultStudyId);
		self.currentResultSource = params.currentResultSource;
		self.currentStudy = params.currentStudy;
		self.cohortDefinition = params.cohortDefinition;
		self.loading = params.loading;
		self.rootJSON = params.rootJSON;
		
		self.ageDistribution = ko.observable();
		self.genderDistribution = ko.observable();
		self.meanAge = ko.observable();
		self.meanObsPeriod = ko.observable();
		self.totalPatients = ko.observable();

		self.loading.subscribe(function (d) {
			self.renderCohortInfo();
		});
		
		self.cohortDefinition.subscribe(function (d) {
			self.renderCohortInfo();
		});
		
		self.rootJSON.subscribe(function (d) {
			self.renderCohortInfo();
		});
		
		self.resultMode.subscribe(function (d) {
			self.renderCohortInfo();
		});
		
		self.currentResultSource.subscribe(function (d) {
			self.renderCohortInfo();
		});
		
		self.renderCohortInfo = function(){
			if (self.model != null){
				
					var url = config.services[0].url + self.currentResultSource().sourceKey + '/cohortresults/' + self.currentStudy().cohortDefId + "/summarydata";
				
					$.ajax({
						url: url,
						method: 'GET',
						success: function (d) {
							self.ageDistribution(d.ageDistribution);
							self.genderDistribution(d.genderDistribution);
							self.meanAge(d.meanAge);
							self.meanObsPeriod(d.meanObsPeriod);
							self.totalPatients(d.totalPatients);

							if (self.meanAge() !== null) {
								self.meanAge( Math.round(+self.meanAge()));
							}

							self.renderOHDSIDefaults();
						}
				});
			}			
		};
		
	    self.renderOHDSIDefaults = function() {
	    	// reset
	        d3.selectAll("#gender_dist svg").remove();
	        d3.selectAll("#age_dist svg").remove();

	        // gender
	        if (self.genderDistribution()) {
	            var genderDonut = new jnj_chart.donut();
	            genderDonut.render(self.mapConceptData(self.genderDistribution()), "#gender_dist", 260, 100, {
	                colors: d3.scale.ordinal()
	                    .domain([8507, 8551, 8532])
	                    .range(["#1F78B4", "#33A02C", "#FB9A99"]),
	                margin: {
	                    top: 5,
	                    bottom: 10,
	                    right: 150,
	                    left: 10
	                }
	            });
	        }

	        // age at first obs histogram
	        if (self.ageDistribution()) {
	            var histData = {};
	            histData.intervalSize = 1;
	            histData.data = self.normalizeArray(self.ageDistribution(), true);
	            if (!histData.data.empty) {
	                histData.min = 0;
	                histData.max = 100;
	                histData.intervals = 100;
	                var ageAtFirstObservationData = self.mapHistogram(histData);
	                var ageAtFirstObservationHistogram = new jnj_chart.histogram();
	                ageAtFirstObservationHistogram.render(ageAtFirstObservationData, "#age_dist", 460, 195, {
	                    xFormat: d3.format('d'),
	                    xLabel: 'Age',
	                    yLabel: 'People'
	                });
	            }
	        }
	    };
		
	    self.mapConceptData = function (data) {
			var result;

	        if (data instanceof Array) {
	            result = [];
	            $.each(data, function() {
	                var datum = {}
	                datum.id = (+this.conceptId|| this.conceptName);
	                datum.label = this.conceptName;
	                datum.value = +this.countValue;
	                result.push(datum);
	            });
	        }
			else if (data.countValue instanceof Array) // multiple rows, each value of each column is in the indexed properties.
			{
				result = data.countValue.map(function (d, i) {
					var datum = {}
					datum.id = (this.conceptId|| this.conceptName)[i];
					datum.label = this.conceptName[i];
					datum.value = this.countValue[i];
					return datum;
				}, data);


			} else // the dataset is a single value result, so the properties are not arrays.
			{
				result = [
					{
						id: data.conceptId,
						label: data.conceptName,
						value: data.countValue
				}];
			}

	        result = result.sort(function (a, b) {
	            return b.label < a.label ? 1 : -1;
	        });

			return result;
		}
		
	    self.mapHistogram = function (histogramData) {
			// result is an array of arrays, each element in the array is another array containing information about each bar of the histogram.
			var result = new Array();
	        if (!histogramData.data || histogramData.data.empty) {
	            return result;
	        }
			var minValue = histogramData.min;
			var intervalSize = histogramData.intervalSize;

			for (var i = 0; i <= histogramData.intervals; i++) {
				var target = new Object();
				target.x = minValue + 1.0 * i * intervalSize;
				target.dx = intervalSize;
				target.y = histogramData.data.countValue[histogramData.data.intervalIndex.indexOf(i)] || 0;
				result.push(target);
			};

			return result;
		}
	    
	    self.normalizeArray = function (ary, numerify) {
	        var obj = {};
	        var keys;

	        if (ary && ary.length > 0 && ary instanceof Array) {
	            keys = d3.keys(ary[0]);

	            $.each(keys, function() {
	                obj[this] = [];
	            });

	            $.each(ary, function() {
	                var thisAryObj = this;
	                $.each(keys, function() {
	                    var val = thisAryObj[this];
	                    if (numerify) {
	                        if (_.isFinite(+val)) {
	                            val = (+val);
	                        }
	                    }
	                    obj[this].push(val);
	                });
	            });
	        } else {
	            obj.empty = true;
	        }

	        return obj;
	    }
	};
			
	var component = {
			viewModel: panaceaCohortResult,
			template: view
		};

	ko.components.register('panacea-cohort-result', component);
	return component;
});