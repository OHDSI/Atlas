define(['knockout', 'text!./concept-by-index.html','d3', 'jnj_chart'], function (ko, view, d3, jnj_chart) {
	function conceptByIndex(params) {
		var self = this;
		self.conceptId = params.conceptId;
		self.cohortDefinitionId = params.cohortDefinitionId;
		self.caption = params.caption;
		self.conceptDomain = params.conceptDomain.toLowerCase();
		self.resultsUrl = params.resultsUrl;

		self.dataframeToArray = function (dataframe) {
			// dataframes from R serialize into an obect where each column is an array of values.
			var keys = d3.keys(dataframe);
			var result;
			if (dataframe[keys[0]] instanceof Array) {
				result = dataframe[keys[0]].map(function (d, i) {
					var item = {};
					var container = this;
					keys.forEach(function (p) {
						item[p] = container[p][i];
					});
					return item;
				}, dataframe);
			} else {
				result = [dataframe];
			}
			return result;
		}

		self.normalizeArray = function (ary, numerify) {
			var obj = {};
			var keys;

			if (ary && ary.length > 0 && ary instanceof Array) {
				keys = d3.keys(ary[0]);

				$.each(keys, function () {
					obj[this] = [];
				});

				$.each(ary, function () {
					var thisAryObj = this;
					$.each(keys, function () {
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

		self.render = function () {
			$('#concept-by-index-caption').html(self.caption);

			$.ajax({
				type: "GET",
				url: self.resultsUrl + self.cohortDefinitionId + '/cohortspecific' + self.conceptDomain + "/" + self.conceptId,
				contentType: "application/json; charset=utf-8",
				success: function (result) {


					if (result && result.length > 0) {
						var normalized = self.dataframeToArray(self.normalizeArray(result));

						// nest dataframe data into key->values pair
						var totalRecordsData = d3.nest()
							.key(function (d) {
								return d.recordType;
							})
							.entries(normalized)
							.map(function (d) {
								return {
									name: d.key,
									values: d.values
								};
							});

						var scatter = new jnj_chart.scatterplot();

						scatter.render(totalRecordsData,'#concept-by-index-scatterplot', 460, 150, {
							yFormat: d3.format('0.2%'),
							xValue: "duration",
							yValue: "pctPersons",
							xLabel: "Duration Relative to Index",
							yLabel: "% Persons",
							seriesName: "recordType",
							showLegend: true,
							tooltips: [
								{
									label: 'Series',
									accessor: function (o) {
										return o.recordType;
									}
											},
								{
									label: 'Percent Persons',
									accessor: function (o) {
										return d3.format('0.2%')(o.pctPersons);
									}
										},
								{
									label: 'Duration Relative to Index',
									accessor: function (o) {
										var years = Math.round(o.duration / 365);
										var days = o.duration % 365;
										var result = '';
										if (years != 0)
											result += years + 'y ';

										result += days + 'd'
										return result;
									}
										},
								{
									label: 'Person Count',
									accessor: function (o) {
										return o.countValue;
									}
										}
									]
						});
					}
				}
			});
		}
		self.render();
	}

	var component = {
		viewModel: conceptByIndex,
		template: view
	};

	ko.components.register('visualizations/concept-by-index', component);
	return component;
});