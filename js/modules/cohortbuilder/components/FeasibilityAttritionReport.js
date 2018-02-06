define(['knockout',
				'jquery',
				'd3',
				'text!./FeasibilityAttritionReport.html',
			  'css!../css/report.css'
			 ], function (
	ko,
	$,
	d3,
	template) {

	function FeasibilityAttritionReport(params) {
		var self = this;

		function countMatch(node, mask) {
			var count = 0;
			if (node.hasOwnProperty("children"))
			{
				node.children.forEach(function(c) {
					count += countMatch(c,mask);
				});
			} else {
				count = node.name.startsWith(mask) ? node.size : 0;
			}
			return count;
		}
		
		self.report = params.report;
		self.attritionStats = ko.pureComputed(function () {
			var treemapData = JSON.parse(self.report().treemapData);
			// create the attrition counts based on the index of the inclusion rule.
			// index 0 must match startWith('1'), index 1 must startWith('11'), etc.
			var priorPct = 1.0;
			var stats = self.report().inclusionRuleStats.map(function (d, i) {
				var countSatisfying = countMatch(treemapData, '1'.repeat(i+1));
				var percentSatisfying = self.report().summary.baseCount != 0 ? countSatisfying/self.report().summary.baseCount : 0;
				var pctDiff = priorPct - percentSatisfying;
				priorPct = percentSatisfying;
				return {
					name: d.name,
					countSatisfying: countSatisfying,
					percentSatisfying: percentSatisfying,
					pctDiff : pctDiff
				};
			});
			return stats;
		});
		
		self.formatPercent = function (value) {
			return (100.0 * value).toFixed(2) + '%';	
		}
		
		self.color = d3.scaleQuantize()
				.domain([1.0, .75, .5, .25, .10])
				.range(["#7BB209", "#95B90A", "#C9C40D", "#E77F13", "#FF3D19"]);
	}


	var component = {
		viewModel: FeasibilityAttritionReport,
		template: template
	};

	ko.components.register('feasibility-attrition-report', component);

	// return compoonent definition
	return component;
	
});