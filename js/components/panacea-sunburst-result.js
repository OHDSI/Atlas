define(['knockout', 'text!./panacea-sunburst-result.html', 'jquery', 'd3'], function (ko, view, $, d3) {
	function panaceaSunburstResult(params) {
		var self = this;
		self.model = params.model;
		self.services = params.services;
		self.panaceaResultStudyId = ko.observable();

		if (self.model != null && self.model.hasOwnProperty('panaceaResultStudyId')){
			self.panaceaResultStudyId(params.model.panaceaResultStudyId);
		}

		var width = 960,
		height = 700,
		radius = Math.min(width, height) / 2;

		var x = d3.scale.linear()
			.range([0, 2 * Math.PI]);

		var y = d3.scale.sqrt()
			.range([0, radius]);

		var color = d3.scale.category20c();

		var svg = d3.select("#pnc_sunburst_result_div").append("svg")
			.attr("width", width)
			.attr("height", height)
			.append("g")
			.attr("transform", "translate(" + width / 2 + "," + (height / 2 + 10) + ")");

		var partition = d3.layout.partition()
			.value(function(d) { return d.percentage; });

		var arc = d3.svg.arc()
			.startAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x))); })
			.endAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x + d.dx))); })
			.innerRadius(function(d) { return Math.max(0, y(d.y)); })
			.outerRadius(function(d) { return Math.max(0, y(d.y + d.dy)); });

//TODO !!! -- add sourceId
		var url = self.services()[0].url + 'panacea/getStudySummary/' + self.panaceaResultStudyId() + '/1';
		d3.json(url, function(error, root) {
			if (error) {
				throw error;
			}

			var changedRoot = JSON.parse(root["studyResultFiltered"]);
  
			var path = svg.selectAll("path")
				.data(partition.nodes(changedRoot))
				.enter().append("path")
				.attr("d", arc)
				.style("fill-rule", "evenodd")
				.style("fill", function(d) { return color(d.conceptName); })
			;
//comment out for not letting zoom in/out
			//      .on("click", click);


			//draw legend below.....
			var legendRectSize = 18;
			var legendSpacing = 4;

			var legend = svg.selectAll('.legend')
				.data(color.domain())
				.enter()
				.append('g')
				.attr('class', 'pnc-legend')
				.attr('transform', function(d, i) {
					var height = legendRectSize + legendSpacing;
					var offset =  height * color.domain().length / 2;
					//var horz = -2 * legendRectSize;
					var horz = -25 * legendRectSize;
					var vert = i * height - offset;

					if(i == 0)
						return 'translate(-1000,-1000)';
					return 'translate(' + horz + ',' + vert + ')';
				});

			legend.append('rect')
				.attr('width', legendRectSize)
				.attr('height', legendRectSize)
				.attr('class','pnc-rect')
				.style('fill', color)
				.style('stroke', color);

			legend.append('text')
				.attr('x', legendRectSize + legendSpacing)
				.attr('y', legendRectSize - legendSpacing)
				.text(function(d) { return d; });
			//draw legend done.........

			//add tootip here.....
			var tooltip = d3.select("body")
				.append('div')
				.attr('class', 'pnc-tooltip');

			tooltip.append('div')
				.attr('class', 'pnc-tooltip-label');

			tooltip.append('div')
				.attr('class', 'pnc-tooltip-duration');

			path.on('mouseover', function(d) {
				tooltip.select('.pnc-tooltip-label').html(d.conceptName + ":" + d.patientCount + ":" + d.percentage + "%");
				tooltip.select('.pnc-tooltip-duration').html( d.avgDuration + " days:" + d.avgGapDay + ":" + d.gapPercent + "%");
				tooltip.style('display', 'block');
			});

			path.on('mouseout', function() {
				tooltip.style('display', 'none');
			});
			//tooltip done here......

			self.click = function (d) {
				path.transition()
				.duration(750)
				.attrTween("d", arcTween(d));
			}
		});

		d3.select(self.frameElement).style("height", height + "px");

		// Interpolate the scales!
		self.arcTween = function (d) {
			var xd = d3.interpolate(x.domain(), [d.x, d.x + d.dx]),
			yd = d3.interpolate(y.domain(), [d.y, 1]),
			yr = d3.interpolate(y.range(), [d.y ? 20 : 0, radius]);
			return function(d, i) {
				return i ? function(t) { return arc(d); }: function(t) { x.domain(xd(t)); y.domain(yd(t)).range(yr(t)); return arc(d); 
				};
			};
		}
		
		self.back = function () {
			document.location = "#/panacea";
		}
	};
	
	var component = {
			viewModel: panaceaSunburstResult,
			template: view
		};

	ko.components.register('panacea-sunburst-result', component);
	return component;
});