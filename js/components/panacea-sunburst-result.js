define(['knockout', 'text!./panacea-sunburst-result.html', 'jquery', 'd3'], function (ko, view, $, d3) {
	function panaceaSunburstResult(params) {
		var self = this;
		self.model = params.model;
		self.services = params.services;
		self.panaceaResultStudyId = ko.observable();
		self.sources = self.services()[0].sources;
		self.currentResultSource = ko.observable();
		self.resultMode = ko.observable('report');
		self.currentStudy = ko.observable();
		self.startDate = ko.observable();
		self.endDate = ko.observable();
		self.gapThreshold = ko.observable();
		self.selectedConcepts = ko.observableArray();
		self.loading = ko.observable(true);
		
		if (self.model != null && self.model.hasOwnProperty('panaceaResultStudyId')){
			self.panaceaResultStudyId(params.model.panaceaResultStudyId);
			
			$.ajax({
				url: self.services()[0].url + 'panacea/' + self.panaceaResultStudyId(),
				method: 'GET',
				success: function (d) {
					self.currentStudy(d);
//					self.studyName(d.studyName);
//					self.studyDesc(d.studyDesc);
//					self.studyDuration(d.studyDuration);
//					self.switchWindow(d.switchWindow);
//					self.currentConceptsExpression(d.concepSetDef);
					if(d.startDate){
						self.startDate(new Date(d.startDate).toISOString().split('T')[0]);
					}else{
						self.startDate(null);
					}
					if(d.endDate){
						self.endDate(new Date(d.endDate).toISOString().split('T')[0]);
					}else{
						self.endDate(null);
					}
//					self.minUnitDays(d.minUnitDays);
//					self.minUnitCounts(d.minUnitCounts);
					if(d.gapThreshold != null){
						self.gapThreshold(100 - d.gapThreshold);
					}
				}
			});
		}

		self.currentStudy.subscribe(function (d) {
			$.ajax({
				url: self.services()[0].url + 'conceptset/' + self.currentStudy().conceptSetId  +'/expression',
				method: 'GET',
				success: function (d) {
					self.selectedConcepts.removeAll();
					for (var i = 0; i < d.items.length; i++) {
						var conceptSetItem = {};

						conceptSetItem.concept = d.items[i].concept;
						conceptSetItem.isExcluded = ko.observable(d.items[i].isExcluded);
						conceptSetItem.includeDescendants = ko.observable(d.items[i].includeDescendants);
						conceptSetItem.includeMapped = ko.observable(d.items[i].includeMapped);

						
//						selectedConceptsIndex[d[i].concept.CONCEPT_ID] = 1;
						self.selectedConcepts.push(conceptSetItem);
					}
					
					self.loading(false);
				}
			});
		});	
		
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

//		var url = self.services()[0].url + 'panacea/getStudySummary/' + self.panaceaResultStudyId() + '/' + self.currentResultSource().sourceId;
		
		self.currentResultSource.subscribe(function (d) {
			
			var url = self.services()[0].url + 'panacea/getStudySummary/' + self.panaceaResultStudyId() + '/' + self.currentResultSource().sourceId;
			
			d3.json(url, function(error, root) {
				if (error) {
					svg.selectAll("path").remove();
					svg.selectAll("g").remove();
				}else{
					svg.selectAll("path").remove();
					svg.selectAll("g").remove();
					
					if(!(root["studyResultFiltered"] === undefined || root["studyResultFiltered"] === null)) {
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
					}
				}
			});
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
	
		self.renderConceptSetCheckBox = function(field){
			return '<span data-bind="css: { selected: ' + field + '} " class="fa fa-check"></span>';
		}
		
		self.routeTo = function (resultMode) {
			self.resultMode(resultMode);
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