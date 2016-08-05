/*
 * knockout component
 * calls jnj.chart.zoomScatter, manages ajax call
 * and assuring unique id for chart div so multiple
 * charts can be made.
 * feed data through jsonFile parameter (url) or
 *	data observable
 * zoomScatter knows nothing about knockout
 */
"use strict";
define(['knockout', 'text!./scatterplot.html', 'jnj_chart'], function (ko, view, jnj_chart) {
	var _idnum = 1;
	function scatterplot(params) {
		var self = this;
		self.loading = ko.observable(true);
		self.data = params.data;
		self.jsonFile = params.jsonFile;
		self.chartOptions = params.chartOptions;
		self.dataSetup = ko.utils.unwrapObservable(params.dataSetup)
											|| (d => d);
											// callback for modifying data after loading
		self.scatter = new jnj_chart.zoomScatter();
		self.id = function() {	// uniq id generator
														// -- assuming this file
														// is only loaded once
			return self._id = `scatter_${_idnum++}`;
		};
		self.error = ko.observable();
		if (self.jsonFile && self.data) {
			self.error("don't pass both jsonFile and data");
		}
		self.ready = ko.computed(function() {
			return !(self.loading() || self.error());
		});
		if (self.data) {
			var data = self.dataSetup(self.data);
			callScatter(self._id, data, self.chartOptions);

		} else if (self.jsonFile) {
			loadData(self.jsonFile, 
						function(data) {
							data = self.dataSetup(data);
							self.loading(false);
							callScatter(self._id, data, self.chartOptions);
						});
		} else {
			self.loading(false);
			self.error("need to send jsonFile or data");
		}

		function callScatter(divid, data) {
			var scatter = new jnj_chart.zoomScatter();
			scatter.render(data, '#'+divid, 460, 150, 
										self.chartOptions
										);
		}
	};

	var component = {
		viewModel: scatterplot,
		template: view
	};

	ko.components.register('scatterplot', component);
	return component;

	function loadData(jsonFile, cb) {
		var url = jsonFile;
		console.log(url);
		var request = $.ajax({
			url: url,
			method: 'GET',
			contentType: 'application/json',
			error: function (err) {
				console.log(err);
			},
			success: function (data) {
				cb(data);
			}
		});
	}

});
