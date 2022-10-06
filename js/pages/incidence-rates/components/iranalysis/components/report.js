define([
	'knockout',
	'jquery',
	'text!./report.html',
	'services/IRAnalysis',
	'd3',
	'components/Component',
	'utils/CommonUtils',
	'utils/ChartUtils',
	'databindings',
	'databindings/irTreemapLegend',
	'css!components/cohortbuilder/css/report.css'
], function (
	ko,
	$,
	view,
	IRAnalysisService,
	d3,
	Component,
	commonUtils,
	ChartUtils
) {
	
	function bitCounter(bits) {
		counted = 0;
		for (b = 0; b < bits.length; b++) {
			if (bits[b] == '1') {
				counted++;
			}
		}
		return counted;
	}
	
	class IRAnalysisReportsViewer extends Component {
		constructor(params) {
			super(params);

			var colors = ["#2c7bb6", "#00a6ca","#00ccbc","#90eb9d","#ffff8c","#f9d057","#f29e2e","#e76818","#d7191c"];
			
			this.report = params.report;
			this.targetCohortId = params.target;
			this.outcomeCohortId = params.outcome;
			this.calculateRate = params.calculateRate;
			this.calculateProportion = params.calculateProportion;
			this.rateModifiers = params.rateModifiers;
			this.rateCaption = params.rateCaption;
			this.ipCaption = params.ipCaption;
			this.rectSummary = ko.observable();
			this.pass = ko.observableArray();
			this.fail = ko.observableArray();			
			this.treemapOptions = ko.pureComputed(() => {
				var options = {};
				options.colorPicker = this.colorPicker();
				return options;
			});
			this.name = 'ir-report';
			// behaviors
			
			this.treeIRExtent = ko.pureComputed(() => {
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
				
				if (this.report()) {
					traverse(JSON.parse(this.report().treemapData));
				}
				var extent = d3.extent(rates);
				return [extent[0], Math.max(extent[0] * 1.001, extent[1])]; // padd the upper bound in the case where there is only 1 incidence rate calculated and we want to have an extent > 0
			});
			
			this.colorPicker = ko.pureComputed(() => {
				
				var extent = this.treeIRExtent();
				
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

			this.describeClear = this.describeClear.bind(this);
			this.describe = this.describe.bind(this);
			this.handleCellOver = this.handleCellOver.bind(this);
		}
		
		describeClear() {
			this.rectSummary(null);
			this.pass.removeAll();
			this.fail.removeAll();
		}

		describe(bits, size, cases, timeAtRisk) {
			var matched = bitCounter(bits);
			var pass_count = 0;
			var fail_count = 0;
			var passed = [];
			var failed = [];

			for (b = 0; b < bits.length; b++) {
				if (bits[b] == '1') {
					passed.push(this.report().stratifyStats[b]);
					pass_count++;
				} else {
					failed.push(this.report().stratifyStats[b]);
					fail_count++;
				}
			}

			var percentage = 0;
			if (this.report().summary.totalPersons > 0) {
				percentage = (size / this.report().summary.totalPersons * 100);
			}
			this.pass(passed);
			this.fail(failed);
			//this.rectSummary(`${size people} (${percentage.toFixed(2)}%), ${pass_count} criteria passed, ${fail_count} criteria failed.`);
			this.rectSummary(`${cases.toLocaleString()} cases, ${timeAtRisk.toLocaleString()} TAR, Rate: ${this.calculateRate(cases, timeAtRisk)} ${this.rateCaption()}<br/>${size.toLocaleString()} (${percentage.toFixed(2)}%) people, ${pass_count} criteria passed, ${fail_count} criteria failed.`);
		}

		handleCellOver(data, context, event) {
			if (event.target.__data__) {
				var treemapDatum = event.target.__data__.data;
				this.describe(treemapDatum.name, treemapDatum.size, treemapDatum.cases, treemapDatum.timeAtRisk);
			} else {
				return false;
			}
		}

		export(data, el) {
			const svg = el.target.closest(".visualization_container").querySelectorAll('svg');
			const combineSvg = ChartUtils.combineSvgWithLegend(svg);
			ChartUtils.downloadSvgAsPng(combineSvg, this.name || "untitled.png");
		}

		exportSvg(data, el) {
			const svg = el.target.closest(".visualization_container").querySelectorAll('svg');
			const combineSvg = ChartUtils.combineSvgWithLegend(svg);
			ChartUtils.downloadSvg(combineSvg, `${this.name}.svg` || "untitled.svg");
		}
	}
	
	return commonUtils.build('ir-analysis-report', IRAnalysisReportsViewer, view);
});