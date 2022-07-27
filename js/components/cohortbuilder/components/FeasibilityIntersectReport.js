define(['knockout',
				'jquery',
				'text!./FeasibilityIntersectReport.html',
				'databindings/cohortbuilder/populationTreemapBinding',
				'databindings/eventListenerBinding',
			  'css!../css/report.css'
			 ], function (
	ko,
	$,
	template) {

	function bitCounter(bits) {
		let counted = 0;
		for (let b = 0; b < bits.length; b++) {
			if (bits[b] === '1') {
				counted++;
			}
		}
		return counted;
	}

	function FeasibilityIntersectReport(params) {
		var self = this;

		self.report = params.report;
		self.rectSummary = ko.observable();
		self.pass = ko.observableArray();
		self.fail = ko.observableArray();

		self.checkedRulesIds = ko.observableArray(self.report().inclusionRuleStats.map(r => r.id));

		self.describeClear = function () {
			self.rectSummary(null);
			self.pass.removeAll();
			self.fail.removeAll();
		}

		self.describe = function (bits, size) {
			var matched = bitCounter(bits);
			var pass_count = 0;
			var fail_count = 0;
			var passed = [];
			var failed = [];

			for (let b = 0; b < bits.length; b++) {
				if (bits[b] === '1') {
					passed.push(self.report().inclusionRuleStats[b]);
					pass_count++;
				} else {
					failed.push(self.report().inclusionRuleStats[b]);
					fail_count++;
				}
			}

			var percentage = 0;
			if (self.report().summary.baseCount > 0) {
				percentage = (size / self.report().summary.baseCount * 100);
			}
			self.pass(passed);
			self.fail(failed);
			// self.rectSummary(size + ' people (' + percentage.toFixed(2) + '%), ' + pass_count + ' criteria passed, ' + fail_count + ' criteria failed.');
			self.rectSummary(ko.i18nformat('components.feasibilityIntersectReport.rectSummary', '<%=size%> people (<%=percentage%>%), <%=passCount%> criteria passed, <%=failCount%> criteria failed.', {size: size, percentage: percentage.toFixed(2), passCount: pass_count, failCount: fail_count  })());
		}

		self.handleCellOver = function (data, context, event) {
			if (event.target.__data__) {
				var treemapDatum = event.target.__data__.data;
				self.describe(treemapDatum.name, treemapDatum.size);
			} else {
				return false;
			}
		}

		self.headerCheckboxClicked = () => {
			if (self.checkedRulesIds().length === self.report().inclusionRuleStats.length) {
				self.checkedRulesIds.removeAll();
			} else {
				self.checkedRulesIds(self.report().inclusionRuleStats.map(r => r.id));
			}
		}

		self.isRuleChecked = (id) => {
			return self.checkedRulesIds.indexOf(id) > -1;
		}

		self.checkRule = (id) => {
			if (self.isRuleChecked(id)) {
				self.checkedRulesIds.remove(id);
			} else {
				self.checkedRulesIds.push(id);
			}
		}
	}

	var component = {
		viewModel: FeasibilityIntersectReport,
		template: template
	};

	ko.components.register('feasibility-intersect-report', component);

	// return compoonent definition
	return component;

});