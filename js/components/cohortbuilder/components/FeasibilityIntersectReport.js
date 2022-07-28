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

	function FeasibilityIntersectReport(params) {
		const self = this;

		self.report = params.report;
		self.reportType = params.reportType;
		self.rectSummary = ko.observable();
		self.pass = ko.observableArray();
		self.fail = ko.observableArray();
		self.populationTreemapData = ko.observable({ data: self.report().treemapData });
		//self.parsedTreemapData = JSON.parse(self.report().treemapData);

		self.rulesAllOrAny = ko.observable('any');
		self.rulesAllOrAny.subscribe(() => self.grayRectsInTreemap());
		self.checkedRulesIds = ko.observableArray(self.report().inclusionRuleStats.map(r => r.id));

		self.summaryValue = ko.observable(0);
		self.summaryPercent = ko.observable(0);
		self.summaryPercentToGain = ko.observable();

		self.describeClear = function () {
			self.rectSummary(null);
			self.pass.removeAll();
			self.fail.removeAll();
		}

		self.describe = function (bits, size) {
			let pass_count = 0,
				fail_count = 0,
				passed = [],
				failed = [];

			for (let b = 0; b < bits.length; b++) {
				if (bits[b] === '1') {
					passed.push(self.report().inclusionRuleStats[b]);
					pass_count++;
				} else {
					failed.push(self.report().inclusionRuleStats[b]);
					fail_count++;
				}
			}

			let percentage = 0;
			if (self.report().summary.baseCount > 0) {
				percentage = (size / self.report().summary.baseCount * 100);
			}
			self.pass(passed);
			self.fail(failed);
			self.rectSummary(ko.i18nformat('components.feasibilityIntersectReport.rectSummary',
				'<%=size%> people (<%=percentage%>%), <%=passCount%> criteria passed, <%=failCount%> criteria failed.',
				{size: size, percentage: percentage.toFixed(2), passCount: pass_count, failCount: fail_count })());
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
			self.grayRectsInTreemap();
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
			self.grayRectsInTreemap();
		}

		self.grayRectsInTreemap = () => {
			self.populationTreemapData.valueHasMutated(); // rerender treemap

			setTimeout(() => {
				const checkRulesAll = (rectId, checkForFail) => {
					const checkedRulesIds = self.checkedRulesIds();
					if (checkedRulesIds.length === 0) {
						return false;
					}
					for (let i = 0; i < checkedRulesIds.length; i++)  {
						if (rectId[checkedRulesIds[i]] !== (checkForFail ? '0' : '1')) {
							return false;
						}
					}
					return true;
				};

				const checkRulesAny = (rectId, checkForFail) => {
					let checkPassed = false;
					ko.utils.arrayForEach(self.checkedRulesIds(), (id) => {
						if (rectId[id] === (checkForFail ? '0' : '1')) {
							checkPassed = true;
						}
					});
					return checkPassed;
				};

				self.summaryValue(0);
				self.summaryPercent(0);
				const rects = $('#treemap' + self.reportType).find('rect');
				ko.utils.arrayForEach(rects, (rect) => {
					if (self.rulesAllOrAny() === 'any' && checkRulesAny(rect.id) ||
						self.rulesAllOrAny() === 'all' && checkRulesAll(rect.id) ||
						self.rulesAllOrAny() === 'anyFail' && checkRulesAny(rect.id, true) ||
						self.rulesAllOrAny() === 'allFail' && checkRulesAll(rect.id, true)) {

						self.summaryValue(self.summaryValue() + rect.__data__.value);

						let percent = 0;
						if (self.report().summary.baseCount > 0) {
							percent = (rect.__data__.value / self.report().summary.baseCount * 100);
							self.summaryPercent(self.summaryPercent() + percent);
						}

						return;
					}
					rect.setAttribute('style', 'fill: #CCC');
				});
			}, 0);
		};

		self.grayRectsInTreemap();
	}

	var component = {
		viewModel: FeasibilityIntersectReport,
		template: template
	};

	ko.components.register('feasibility-intersect-report', component);

	// return compoonent definition
	return component;

});