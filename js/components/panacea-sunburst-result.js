define(['knockout', 'text!./panacea-sunburst-result.html', 'jquery', 'd3', 'appConfig', 'cohortbuilder/CohortDefinition', 
        ,'cohortdefinitionviewer'
        ,'knockout.dataTables.binding'
        ,'faceted-datatable'
        ,'databindings'
], function (ko, view, $, d3, config, CohortDefinition) {
	function panaceaSunburstResult(params) {
		var self = this;
		self.model = params.model;
		self.services = params.services;
		self.panaceaResultStudyId = ko.observable();
		self.sources = config.services[0].sources;
		self.currentResultSource = ko.observable();
		self.currentResultSource.extend({ notify: 'always' });
		self.resultMode = ko.observable('report');
		self.resultMode.extend({ notify: 'always' });
		self.currentStudy = ko.observable();
		self.currentStudy.extend({ notify: 'always' });
		self.startDate = ko.observable();
		self.endDate = ko.observable();
		self.gapThreshold = ko.observable();
		self.selectedConcepts = ko.observableArray();
		self.cohortDefinition = ko.observable();
		self.cohortDefinition.extend({ notify: 'always' });
		self.loading = ko.observable(true);
		self.loading.extend({ notify: 'always' });
		self.rootJSON = ko.observable();
		self.rootJSON.extend({ notify: 'always' });
		self.printview = false;
		
		if (self.model != null && self.model.hasOwnProperty('panaceaResultStudyId')){
			self.panaceaResultStudyId(params.model.panaceaResultStudyId);
			
			$.ajax({
				url: config.services[0].url + 'panacea/' + self.panaceaResultStudyId(),
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
				url: config.services[0].url + 'conceptset/' + self.currentStudy().conceptSetId  +'/expression',
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
					
					if(self.selectedConcepts() !=null && self.cohortDefinition() != null){
						self.loading(false);
					}
				}
			});
			
			$.ajax({
				url: config.services[0].url + 'cohortdefinition/' + self.currentStudy().cohortDefId,
				method: 'GET',
				contentType: 'application/json',
				success: function (cohortDefinition) {
					cohortDefinition.expression = JSON.parse(cohortDefinition.expression);
					self.cohortDefinition(new CohortDefinition(cohortDefinition));
//					self.model.currentCohortDefinition(cohortDefinition);

					if(self.selectedConcepts() !=null && self.cohortDefinition() != null){
						self.loading(false);
					}
				}
			});
		});	
		
		self.currentResultSource.subscribe(function (d) {

			var width = 960,
			height = 700,
			radius = Math.min(width, height) / 2;

//			var x = d3.scale.linear()
//				.range([0, 2 * Math.PI]);
//
//			var y = d3.scale.sqrt()
//				.range([0, radius]);

//			var color = d3.scale.category20c();

			var div1 = d3.select("#pnc_sunburst_result_div");
			div1.selectAll("*").remove();
			var svg = d3.select("#pnc_sunburst_result_div").append("svg")
				.attr("width", width)
				.attr("height", height)
				.append("g")
				.attr("transform", "translate(" + width / 2 + "," + (height / 2 + 10) + ")");
			var tltp1Div = d3.select("#pnc_sunburst_tltp1");
			
			var div2 = d3.select("#pnc_sunburst_result_div_2");
			div2.selectAll("*").remove();
			var svg2 = d3.select("#pnc_sunburst_result_div_2").append("svg")
				.attr("width", width)
				.attr("height", height)
				.append("g")
				.attr("transform", "translate(" + width / 2 + "," + (height / 2 + 10) + ")");
			var tltp2Div = d3.select("#pnc_sunburst_tltp2");
			
//			var partition = d3.layout.partition()
//				.value(function(d) { return d.percentage; });

//			var arc = d3.svg.arc()
//				.startAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x))); })
//				.endAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x + d.dx))); })
//				.innerRadius(function(d) { return Math.max(0, y(d.y)); })
//				.outerRadius(function(d) { return Math.max(0, y(d.y + d.dy)); });
			
			var url = config.services[0].url + 'panacea/getStudySummary/' + self.panaceaResultStudyId() + '/' + self.currentResultSource().sourceId;
			
			d3.json(url, function(error, root) {
				if (error) {
					svg.selectAll("path").remove();
					svg.selectAll("g").remove();
					
					svg2.selectAll("path").remove();
					svg2.selectAll("g").remove();

				}else{
					svg.selectAll("path").remove();
					svg.selectAll("g").remove();

					svg2.selectAll("path").remove();
					svg2.selectAll("g").remove();

					self.rootJSON(root);
					
					var changedRoot = null;
					if(!(root["studyResultFiltered"] === undefined || root["studyResultFiltered"] === null)) {
						changedRoot = JSON.parse(root["studyResultFiltered"]);
					}else if(!(root["studyResultCollapsed"] === undefined || root["studyResultCollapsed"] === null)) {
						changedRoot = JSON.parse(root["studyResultCollapsed"]);
					}
					self.drawSunburst(changedRoot, svg, div1, width, height, radius, tltp1Div, false);
					
					var changedUniquePathRoot = null;
					if(!(root["studyResultUniquePath"] === undefined || root["studyResultUniquePath"] === null)) {
						changedUniquePathRoot = JSON.parse(root["studyResultUniquePath"]);
						self.drawSunburst(changedUniquePathRoot, svg2, div2, width, height, radius, tltp2Div, true);
					}					
				}
			});
		});	

		self.drawSunburst = function(changedRoot, svg, div, width, height, radius, tltpDiv, isUniquePath){
			if(changedRoot !== null){
				var x = d3.scale.linear()
					.range([0, 2 * Math.PI]);

				var y = d3.scale.sqrt()
					.range([0, radius]);
				
				var color = d3.scale.category20c();
				
				//Change this from percentage to patientCount (the arc size/width reflects the size of unit cohort better)
				var partition = d3.layout.partition()
					.value(function(d) { return d.patientCount });
					//.value(function(d) { return isUniquePath ? d.simpleUniqueConceptPercentage : d.percentage; });

				var arc = d3.svg.arc()
					.startAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x))); })
					.endAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x + d.dx))); })
					.innerRadius(function(d) { return Math.max(0, y(d.y)); })
					.outerRadius(function(d) { return Math.max(0, y(d.y + d.dy)); });

				var path = null;
				if(!isUniquePath){
					path = svg.selectAll("path")
						.data(partition.nodes(changedRoot))
						.enter().append("path")
						.attr("d", arc)
						.style("fill-rule", "evenodd")
						.style("fill", function(d) { return color(d.conceptName); })
			;
				//comment out for not letting zoom in/out
				//      .on("click", click);
				}else{
				path = svg.selectAll("path")
					.data(partition.nodes(changedRoot))
					.enter().append("path")
					.attr("d", arc)
					.style("fill-rule", "evenodd")
					//.style("fill", function(d) { return color(d.uniqueConceptsName); });
					.style("fill", function(d) { return color(d.simpleUniqueConceptName); });
			}


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
			////var tooltip = d3.select("body")
//			var tooltip = div
//				.append('div')
//				.attr('class', 'pnc-tooltip')
//				.attr('transform', function() {
//					return 'translate(350, 100)';
//				});
			
			tltpDiv.attr('class', 'pnc-tooltip');
			
			tltpDiv.append('div')
				.attr('class', 'pnc-tooltip-label');

			tltpDiv.append('div')
				.attr('class', 'pnc-tooltip-duration');
			
			tltpDiv.append('div')
			    .attr('class', 'unique_path');

			tltpDiv.append('div')
			    .attr('class', 'from_start');

			path.on('mouseover', function(d) {
				if(d.comboId !== 'root'){
					if(!isUniquePath){
						tltpDiv.select('.pnc-tooltip-label').html(d.conceptName + ":" + d.patientCount + ":" + d.percentage + "%");
					}else{
						//tooltip.select('.pnc-tooltip-label').html(d.uniqueConceptsName + ":" + d.patientCount + ":" + d.percentage + "%");
						tltpDiv.select('.pnc-tooltip-label').html(d.simpleUniqueConceptName + ":" + d.patientCount + ":" + d.simpleUniqueConceptPercentage + "%");
					}
					if(!isUniquePath){
						tltpDiv.select('.pnc-tooltip-duration').html( d.avgDuration + " days:" + d.avgGapDay + ":" + d.gapPercent + "%");
//					tooltip.select('.unique_path').html( "unique count: " + d.uniqueConceptCount);
//					tltpDiv.select('.from_start').html( "Days from start: " + d.daysFromCohortStart);
					}
					//tltpDiv.style('display', 'block');
					tltpDiv.style('visibility', ' visible');
				}
			});

			path.on('mouseout', function() {
				//tltpDiv.style('display', 'none');
				tltpDiv.style('visibility', ' hidden');
			});
			//tooltip done here......

			self.click = function (d) {
				path.transition()
				.duration(750)
				.attrTween("d", arcTween(d, radius));
			}			
		}
			d3.select(self.frameElement).style("height", height + "px");
		}

		// Interpolate the scales!
		self.arcTween = function (d, radius) {
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
		
		self.popPrintView = function(){
			if(!self.printview){
				var leftMenuDiv = d3.select("#wrapperLeftMenu");
				leftMenuDiv.style("display","none");
			
				var mainDiv = d3.select("#wrapperMainWindow");
				mainDiv.style("left", "15px");
				
				d3.select("#printViewLink").text("Close Print View");
				
				self.printview = true;
			}else{
				var leftMenuDiv = d3.select("#wrapperLeftMenu");
				leftMenuDiv.style("display","block");
				
				var mainDiv = d3.select("#wrapperMainWindow");
				mainDiv.style("left", "199px");
				
				d3.select("#printViewLink").text("Print View");
				
				self.printview = false;
			}				
		}
	};
	
	var component = {
			viewModel: panaceaSunburstResult,
			template: view
		};

	ko.components.register('panacea-sunburst-result', component);
	return component;
});