define(['knockout',
				'jquery',
				'text!./report.html',
				'webapi/IRAnalysisAPI',
				'd3',
				'databindings',
				'../databindings/irTreemapLegend',
				'css!cohortbuilder/css/report.css'
], function (
	ko,
	$,
	template,
	irAPI,
	d3) {
	
	function bitCounter(bits) {
		counted = 0;
		for (b = 0; b < bits.length; b++) {
			if (bits[b] == '1') {
				counted++;
			}
		}
		return counted;
	}
	
	function IRAnalysisReportsViewer(params) {
		var self = this;
		var colors = ["#2c7bb6", "#00a6ca","#00ccbc","#90eb9d","#ffff8c","#f9d057","#f29e2e","#e76818","#d7191c"];
		
		self.report = params.report;
		self.targetCohortId = params.target;
		self.outcomeCohortId = params.outcome;
		self.calculateRate = params.calculateRate;
		self.calculateProportion = params.calculateProportion;
		self.rateModifiers = params.rateModifiers;
		self.rateCaption = params.rateCaption;
		self.ipCaption = params.ipCaption;
		self.rectSummary = ko.observable();
		self.pass = ko.observableArray();
		self.fail = ko.observableArray();
		
		// behaviors
		
		self.treeIRExtent = ko.pureComputed(function() {
			var rates = [];
			function traverse(node) {
				if (node.hasOwnProperty("timeAtRisk")  && node.timeAtRisk > 0 && node.cases > 0) {
					rates.push(node.cases / node.timeAtRisk)	
				}
				if (node.hasOwnProperty("children")) {
					node.children.forEach(function (child) {
						traverse(child);
					});
				}
			}
			
			traverse(JSON.parse(self.report().treemapData));
			var extent = d3.extent(rates);
			return [extent[0], Math.max(extent[0] * 1.001, extent[1])]; // padd the upper bound in the case where there is only 1 incidence rate calculated and we want to have an extent > 0
		});
		
		self.colorPicker = ko.pureComputed(function() {
			
			var extent = self.treeIRExtent();
			
			var color = d3.scaleQuantize()
				.domain([extent[0], extent[1]])
				.range(colors);	
			
			var picker = function(d) {
				if (d.cases == 0)
					return "#000000";
				else if (d.timeAtRisk > 0)
					return color(d.cases/d.timeAtRisk);
				else
					return "#bababa";
				
			};
			picker.scale = color;
			return picker;
		});
		
		self.describeClear = function () {
			self.rectSummary(null);
			self.pass.removeAll();
			self.fail.removeAll();
		}

		self.describe = function (bits, size, cases, timeAtRisk) {
			var matched = bitCounter(bits);
			var pass_count = 0;
			var fail_count = 0;
			var passed = [];
			var failed = [];

			for (b = 0; b < bits.length; b++) {
				if (bits[b] == '1') {
					passed.push(self.report().stratifyStats[b]);
					pass_count++;
				} else {
					failed.push(self.report().stratifyStats[b]);
					fail_count++;
				}
			}

			var percentage = 0;
			if (self.report().summary.totalPersons > 0) {
				percentage = (size / self.report().summary.totalPersons * 100);
			}
			self.pass(passed);
			self.fail(failed);
			//self.rectSummary(`${size people} (${percentage.toFixed(2)}%), ${pass_count} criteria passed, ${fail_count} criteria failed.`);
			self.rectSummary(`${cases.toLocaleString()} cases, ${timeAtRisk.toLocaleString()} TAR, Rate: ${self.calculateRate(cases, timeAtRisk)} ${self.rateCaption()}<br/>${size.toLocaleString()} (${percentage.toFixed(2)}%) people, ${pass_count} criteria passed, ${fail_count} criteria failed.`);
		}

		self.handleCellOver = function (data, context, event) {
			if (event.target.__data__) {
				var treemapDatum = event.target.__data__.data;
				self.describe(treemapDatum.name, treemapDatum.size, treemapDatum.cases, treemapDatum.timeAtRisk);
			} else {
				return false;
			}
		}
		
		self.treemapOptions = ko.pureComputed(function() {
			var options = {};
			options.colorPicker = self.colorPicker();
			return options;
		});
		
	}
	
	var component = {
		viewModel: IRAnalysisReportsViewer,
		template: template
	};

	return component;	
});