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
                    if (!d) {
                        console.log('no data');
                        return;
                    }
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
            if (!self.currentStudy()) {
                return;
            }
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

        var colors = ['#d53e4f','#f46d43','#fdae61','#89BF59','#771333','#94A734','#4AA5A5','#3288bd', '#D85555', '#4A2B75',
            '#1F3481', '#136375', '#354B9A', '#2CAA4D'];
        var width = $(window).width() - 200 - 30,
            height = 750,
            radius = Math.min(width, height)/2.25,
            radiusBig = Math.min(width, height)/1.5;

        // Breadcrumb dimensions: width, height, spacing, width of tip/tail.
        var b1 = {
            w: 175, h: 25, s: 3, t: 10
        };
        var b2 = {
            w: 200, h: 25, s: 3, t: 10
        };

		self.currentResultSource.subscribe(function (d) {

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
			
			var url = config.services[0].url + 'panacea/getStudySummary/' + self.panaceaResultStudyId() + '/' + self.currentResultSource().sourceId;
			
			d3.json(url, function(error, root) {
				if (error) {
                    console.log('error getting study summary');
					$('#pnc_sunburst_result_div').empty();
                    $('#pnc_sunburst_result_div_2').empty();

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
					self.drawSunburst(changedRoot, svg, div1, width, height, radiusBig, tltp1Div, 'pnc_explanation',
                        'pnc_legend1', "sequence_1", false);
					
					var changedUniquePathRoot = null;
					if(!(root["studyResultUniquePath"] === undefined || root["studyResultUniquePath"] === null)) {
						changedUniquePathRoot = JSON.parse(root["studyResultUniquePath"]);
                        // console.log(JSON.stringify(changedUniquePathRoot));
						self.drawSunburst(changedUniquePathRoot, svg2, div2, width, height, radius, tltp2Div, 'pnc_explanation_2',
                            'pnc_legend2', "sequence_2",  true);
					}					
				}
			});
		});

        // Given a node in a partition layout, return an array of all of its ancestor
        // nodes, highest first, but excluding the root.
        function getAncestors(node) {
            var path = [];
            var current = node;
            while (current.parent) {
                path.unshift(current);
                current = current.parent;
            }
            return path;
        }

        // Generate a string that describes the points of a breadcrumb polygon.
        function breadcrumbPoints(d, i, isUniquePath) {
            var b = isUniquePath ? b2 : b1;
            var points = [];
            points.push("0,0");
            points.push(b.w + ",0");
            points.push(b.w + b.t + "," + (b.h / 2));
            points.push(b.w + "," + b.h);
            points.push("0," + b.h);
            if (i > 0) { // Leftmost breadcrumb; don't include 6th vertex.
                points.push(b.t + "," + (b.h / 2));
            }
            return points.join(" ");
        }

        function capitalize(a) {
            return a.charAt(0).toUpperCase() + a.slice(1);
        }

        // Update the breadcrumb trail to show the current sequence and percentage.
        function updateBreadcrumbs(nodeArray, percentageString, sequenceId, colorsMap, isUniquePath) {
            var trailId = sequenceId + "_trail";
            var endLabelId = sequenceId + "_endlabel";


            var b = isUniquePath ? b2 : b1;

            // Data join; key function combines name and depth (= position in sequence).
            var g = d3.select("#" + trailId)
                .selectAll("g")
                .data(nodeArray, function(d) {
                    return  (colorsMap[capitalize(isUniquePath ? d.simpleUniqueConceptName : d.conceptName)]) + d.depth;
                });

            // Add breadcrumb and label for entering nodes.
            var entering = g.enter().append("svg:g");

            entering.append("svg:polygon")
                .attr("points", function(d, i) {
                    return breadcrumbPoints(d, i, isUniquePath);
                })
                .style("fill", function(d) { return colorsMap[capitalize(isUniquePath ? d.simpleUniqueConceptName : d.conceptName)] })
                .style("stroke", function(d) {
                    return "#a9a9a9"
                });

            entering.append("svg:text")
                .attr("x", ((b.w + b.t) / 2) - 10)
                .attr("y", b.h / 2)
                .attr("dy", "0.35em")
                .attr("text-anchor", "middle")
                .style("font-size", "11px")
                .style("fill", function(d) {
                    var name = capitalize(isUniquePath ? d.simpleUniqueConceptName : d.conceptName);
                    if (name === "None") {
                        return "#000";
                    } else {
                        return "#fff";
                    }
                })
                .text(function(d) { return capitalize(isUniquePath ? d.simpleUniqueConceptName : d.conceptName); });

            // Set position for entering and updating nodes.
            g.attr("transform", function(d, i) {
                return "translate(" + i * (b.w + b.s) + ", 0)";
            });

            // Remove exiting nodes.
            g.exit().remove();

            // Now move and update the percentage at the end.
            d3.select("#" + trailId).select("#" + endLabelId)
                .attr("x", (nodeArray.length + 0.3) * (b.w + b.s))
                .attr("y", b.h / 2)
                .attr("dy", "0.35em")
                .attr("text-anchor", "middle")
                .text(percentageString);

            // Make the breadcrumb trail visible, if it's hidden.
            d3.select("#" + trailId)
                .style("visibility", "");

        }

        function initializeBreadcrumbTrail(sequenceId, isUniquePath) {
            // Add the svg area.
            var trail = d3.select("#" + sequenceId).append("svg:svg")
                .attr("width", width)
                .attr("height", 35)
                .attr('class', 'trail')
                .attr("id", sequenceId + "_trail");
            // Add the label at the end, for the percentage.
            trail.append("svg:text")
                .attr("id", sequenceId + "_endlabel")
                .style("fill", "#000");
        }

        self.drawSunburst = function(changedRoot, svg, div, width, height, radius, tltpDiv, explanation,
                                     legendId, sequenceId, isUniquePath) {

			if (changedRoot !== null) {
                initializeBreadcrumbTrail(sequenceId, isUniquePath);
                var totalCountFirstTherapy = changedRoot.totalCountFirstTherapy;
                var totalCohortCount = changedRoot.totalCohortCount;
                var firstTherapyPct = changedRoot.firstTherapyPercentage + '%';
                var root_id = isUniquePath ? "root2" : "root1";

                // show totals
                $('.total_first_therapy[unique=' + isUniquePath + ']').text(totalCountFirstTherapy);
                $('.total_cohort_count[unique=' + isUniquePath + ']').text(totalCohortCount);
                $('.first_therapy_pct[unique=' + isUniquePath + ']').text(firstTherapyPct);

                //Change this from percentage to patientCount (the arc size/width reflects the size of unit cohort better)
                var vals = [];
                var partition = d3.layout.partition()
                    .size([2 * Math.PI, radius * radius])
                    .value(function(d) {
                        var val = isNaN(d.patientCount) ?  0 : +d.patientCount;
                        vals.push(val);
                        return val;
                    });
                var arc = d3.svg.arc()
                    .startAngle(function(d) {
                        return d.x;
                    })
                    .endAngle(function(d) {
                        return d.x + d.dx;
                    })
                    .innerRadius(function(d) {
                        return Math.sqrt(d.y);
                    })
                    .outerRadius(function(d) {
                        return Math.sqrt(d.y + d.dy);
                    });

                var nodes = partition.nodes(changedRoot)
                    .filter(function(d) {
                        return (d.dx > 0.0005); // 0.005 radians = 0.29 degrees
                    });

                var uniqueNames = [];
                var colorsMap = {};
                $.each(nodes, function() {
                    var node = this;
                    if (node.comboId !== 'root') {
                        var name = capitalize(isUniquePath ? node.simpleUniqueConceptName : node.conceptName);

                        if (uniqueNames.indexOf(name) < 0) {
                            uniqueNames.push(name);
                        }
                    }
                });
                uniqueNames = uniqueNames.sort();
                $.each(uniqueNames, function(i, v) {
                    var idx = i;
                    while (idx >= colors.length) {
                        idx -= colors.length;
                    }
                    if (v === "None") {
                        colorsMap["None"] = '#fff';
                    } else {
                        colorsMap[capitalize(v)] = colors[idx];
                    }
                });

                console.log(colorsMap);
                console.log((changedRoot));
                //console.log(nodes);


				var path  = svg.selectAll("path")
                    .data(nodes)
                    .enter().append("path")
                    .attr("d", arc)
                    .attr("id", function(d) {
                        var is_root = d.comboId === "root";
                        if (is_root) {
                            return root_id;
                        }

                        return "";
                    })
                    .style("fill-rule", "evenodd")
                    .style("fill", function(d) { return d.comboId === "root" ?  "white"  :
                        colorsMap[capitalize(isUniquePath ? d.simpleUniqueConceptName : d.conceptName)]});

                // mouse events
                var mouseover = function(d) {
                    if(d && d.comboId !== 'root') {
                        $('.sb_stats[unique=' + isUniquePath + ']').css('opacity', 1);
                        var name = (isUniquePath ? d.simpleUniqueConceptName : d.conceptName);
                        var pct = 100 * (+d.patientCount / +totalCountFirstTherapy);
                        var percentage = pct < 0.1 ? 0.09 : pct.toPrecision(3);
                        var percentageString = percentage + "%";
                        if (percentage < 0.1) {
                            percentageString = "<0.1%";
                        }


                        // drug details
                        var patientCount = +d.patientCount;
                        $('.patient_count[unique=' + isUniquePath + ']').text(patientCount);
                        if (name !== "None") {
                            if (!isUniquePath) {
                                var daysFromStart = +d.daysFromCohortStart;
                                var adherence = (100 - +d.gapPercent);
                                adherence = adherence.toPrecision(3);
                                if (adherence < 0.1) {
                                    adherence = '<0.1%';
                                } else {
                                    adherence = adherence + '%';
                                }
                                $('.days_from_start[unique=' + isUniquePath + ']').text(daysFromStart).css('opacity', 1);
                                $('.adherence[unique=' + isUniquePath + ']').text(adherence).css('opacity', 1);
                            }
                        } else {
                            $('.days_from_start[unique=' + isUniquePath + ']').css('opacity', 0);
                            $('.adherence[unique=' + isUniquePath + ']').css('opacity', 0);
                        }

                        var jpos = $('#' + root_id).position();
                        var pos = document.getElementById(root_id).getBoundingClientRect();
                        $('#' + explanation)
                            .css('visibility', 'visible')
                            .css('width', pos.width - 30)
                            .css('top', jpos.top + (pos.width/5))
                            .css('left', width/2 - (pos.width/2) + 32);
                        $('#' + explanation + ' .percent').text(percentageString);
                        $('#' + explanation + ' .nvalue').text('(n = ' + d.patientCount + ')');
                        $('#' + explanation + ' .sublabel')
                            .css('font-weight', 'bold')
                            .text(function() {
                                var words = name.split(',');
                                words = $.map( words, function( val, i ) {
                                    return capitalize(val);
                                });
                                return words.join(', ');
                            });

                        var sequenceArray = getAncestors(d);
                        updateBreadcrumbs(sequenceArray, percentageString, sequenceId, colorsMap, isUniquePath);

                        // Fade all the segments.
                        div.selectAll("path")
                            .style("opacity", 0.4);

                        // Then highlight only those that are an ancestor of the current segment.
                        div.selectAll("path")
                            .filter(function (node) {
                                return (sequenceArray.indexOf(node) >= 0);
                            })
                            .style("opacity", 1);
                    }
                };
                path.on('mouseover', mouseover);
                div.on("mouseleave", function() {


                    d3.selectAll('.trail')
                        .style("visibility", "hidden");

                    // Deactivate all segments during transition.
                    div.selectAll("path").on("mouseover", null);

                    // Transition each segment to full opacity and then reactivate it.
                    div.selectAll("path")
                        .transition()
                        .duration(500)
                        .style("opacity", 1)
                        .each("end", function(d) {

                            d3.select(this).on("mouseover", mouseover);
                        });

                    d3.select('#'+explanation)
                        .style("visibility", "hidden");

                    $('.sb_stats[unique=' + isUniquePath + ']').css('opacity', 0);
                });

		    }
            d3.select(self.frameElement).style("height", height + "px");
		};


	
		self.renderConceptSetCheckBox = function(field){
			return '<span data-bind="css: { selected: ' + field + '} " class="fa fa-check"></span>';
		};
		
		self.routeTo = function (resultMode) {
			self.resultMode(resultMode);
		};
		
		self.back = function () {
			document.location = "#/panacea";
		};
		
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