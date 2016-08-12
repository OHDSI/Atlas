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
		self.processedData = ko.observable();
		self.chartResolution = ko.observable();
		self.jsonFile = params.jsonFile;
		self.csvFile = params.csvFile;
		self.tsvFile = params.tsvFile;
		self.chartOptions = ko.observable(params.chartOptions);
		var dataFile = ko.computed(function() {
			return self.jsonFile || self.csvFile || self.tsvFile;
		});
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
		if (dataFile() && self.data) {
			self.error("don't pass both data file and data");
		}
		self.ready = ko.computed(function() {
			return !(self.loading() || self.error());
		});
		if (self.data) {
			var data = self.dataSetup(self.data);
			callScatter(self, data, self.chartOptions);
		} else if (self.jsonFile) {
			loadData(self.jsonFile, dataLoaded.bind(self));
		} else if (self.csvFile) {
			d3.csv(self.csvFile, dataLoaded.bind(self));
		} else if (self.tsvFile) {
			d3.tsv(self.tsvFile, dataLoaded.bind(self));
		} else {
			self.loading(false);
			self.error("need to send jsonFile or data");
		}

	};
	function callScatter(self, data, options) {
		//var scatter = new jnj_chart.zoomScatter();
		//scatter.render(data, '#'+divid, 460, 150, options);
		self.processedData(data);
		self.chartOptions(options);
		self.chartResolution({width:460, height:150});
	}
	function dataLoaded(data) {
		data = this.dataSetup(data);
		this.loading(false);
		callScatter(this, data, this.chartOptions);
	}

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
