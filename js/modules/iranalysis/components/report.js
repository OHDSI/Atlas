define(['knockout',
				'jquery',
				'text!./report.html',
				'webapi/IRAnalysisAPI',
				'databindings',
				'../bindings/strataTreemapBinding',
				'css!cohortbuilder/css/report.css'
], function (
	ko,
	$,
	template,
	irAPI) {
	
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
		
		self.report = params.report;
		self.targetCohortId = params.target;
		self.outcomeCohortId = params.outcome;
		self.calculateRate = params.calculateRate;
		self.rateModifiers = params.rateModifiers;
		self.rateCaption = params.rateCaption;
		self.rectSummary = ko.observable();
		self.pass = ko.observableArray();
		self.fail = ko.observableArray();
		
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
			self.rectSummary(`${size.toLocaleString()} (${percentage.toFixed(2)}%) people, ${cases.toLocaleString()} cases, ${timeAtRisk.toLocaleString()} TAR, Rate: ${self.calculateRate(cases, timeAtRisk)}<br/>${pass_count} criteria passed, ${fail_count} criteria failed.`);
		}

		self.handleCellOver = function (data, event) {
			if (event.target.__data__) {
				var treemapDatum = event.target.__data__;
				self.describe(treemapDatum.name, treemapDatum.size, treemapDatum.cases, treemapDatum.timeAtRisk);
			} else {
				return false;
			}
		}
		
	}
	
	var component = {
		viewModel: IRAnalysisReportsViewer,
		template: template
	};

	return component;	
});