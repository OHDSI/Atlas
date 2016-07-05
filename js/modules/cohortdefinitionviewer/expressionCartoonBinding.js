"use strict";
define(['knockout','d3', 'lodash'], function (ko, d3, _) {
	window.d3 = d3;
	var width = 400;
	var height = 450;

	var _sections = [
		{name: 'prestart',  width: 18 }, // 10 em? for <starts after> date
		{name: 'start',     width:	10 }, // indeterminate time between prim crit date and index date
		{name: 'poststart', width: 15 }, // for <starts before> date
		{name: 'dur',       width: 60, adjust: -15 }, // should line up with end of start region
		{name: 'preend',    width: 15, adjust: -15 }, // for <ends after> date
		{name: 'end',       width:	10 },
		{name: 'postend',   width: 15 }, //for <ends before> date
		{name: 'extra',     width: 10 },
	];
	var sections = {};
	var offset = 10;
	_.each(_sections, section => {
		section.offset = offset + (section.adjust || 0);
		offset += section.width;
		offset += (section.adjust || 0);
		sections[section.name] = section;
	});
	var xScale = d3.scale.linear().domain([0, cartoonWidth()]);
	function cartoonWidth() {
		return _.chain(sections).map(d=>d.width).sum().value() +
					 _.chain(sections).map(d=>d.adjust).sum().value();
	}
	console.log(sections);
	console.log(cartoonWidth());
	var lineHeight = 15;
	var cartoonHeight = lineHeight * 8; // 6 lines, 15px high?
	function line(num) {
		return lineHeight * num;
	}

	var divWidth = ko.observable();
	ko.bindingHandlers.cohortExpressionCartoon = {
		init: function (element, valueAccessor, allBindingsAccessor) {
			var expression = valueAccessor()[0];
			var selectedFragment = valueAccessor()[1];
			$(element).parents('.tab-pane').bind("DOMSubtreeModified", function() {
				divWidth(element.offsetWidth);
				xScale.range([0, element.offsetWidth]);
			});

			var svg = d3.select(element).append('svg')
										//.attr('width',width)
										//.attr('height',height)
			svg.append('marker')
					.attr('id', 'right-arrow')
					.attr('viewBox', '0 0 10 10')
					.attr('refX', 0)
					.attr('refY', 5)
					.attr('markerUnits', 'strokeWidth')
					.attr('markerWidth', 10)
					.attr('markerHeight', 10)
					.attr('fill','steelblue')
					.attr('orient', 'auto')
					.append('path')
						.attr('d', 'M 0 0 L 10 5 L 0 10 z')
			svg.append('marker')
					.attr('id', 'left-arrow')
					.attr('viewBox', '0 0 10 10')
					.attr('refX', 10)
					.attr('refY', 5)
					.attr('markerUnits', 'strokeWidth')
					.attr('markerWidth', 10)
					.attr('markerHeight', 10)
					.attr('fill','steelblue')
					.attr('orient', 'auto')
					.append('path')
						.attr('d', 'M 10 0 L 10 10 L 0 5 z')
			svg.append('marker')
					.attr('id', 'line-stop')
					.attr('viewBox', '0 0 2 10')
					.attr('refX', 0)
					.attr('refY', 5)
					.attr('markerUnits', 'strokeWidth')
					.attr('markerWidth', 0.5)
					.attr('markerHeight', 2)
					.attr('orient', 'auto')
					.append('path')
						.attr('d', 'M 0 0 L 1 0 L 1 10 L 0 10 z')
		},
		update: function (element, valueAccessor, allBindingsAccessor) {
			if (!divWidth()) {
				return;
			}
			console.log(valueAccessor().tabPath());
			var expression = valueAccessor().expression;
			ko.toJSON(expression);
			if (valueAccessor().tabPath() !== "export/printfriendly") {
				return;
			}
			if (!valueAccessor().delayedCartoonUpdate()) {
				setTimeout(function() {
					valueAccessor().delayedCartoonUpdate("wait for dom");
					console.log('wait for dom');
				}, 20);
				return;
			}
			if (valueAccessor().delayedCartoonUpdate() === 'wait for dom') {
				valueAccessor().delayedCartoonUpdate(null);
				console.log('resetting delay');
			}
			console.log('rendering cartoon');
			console.log("offset width", element.offsetWidth);
			var selectedFragment = valueAccessor().selectedFragment;

			var criteriaGroup = expression().AdditionalCriteria();
			var domain = {
				min: -expression().PrimaryCriteria().ObservationWindow.PriorDays(), 
				max: expression().PrimaryCriteria().ObservationWindow.PostDays()
			};
			var primaryWindow = { min: domain.min, max: domain.max };
			var getEndPoints = function(cg) {
				var s = cg.StartWindow.Start.Days() *
								cg.StartWindow.Start.Coeff();
				var e = cg.StartWindow.End.Days() *
								cg.StartWindow.End.Coeff();
				domain.min = Math.min(domain.min, s);
				domain.max = Math.max(domain.max, e);
			};
			//criteriaGroupWalk(criteriaGroup, getEndPoints); // broken
			var primaryCriteria = _.chain(expression().PrimaryCriteria().CriteriaList())
															.map(_.pairs)
															.flatten()
															.map(d=>{
																	var [domain, pc] = d;
																	var clone = _.clone(pc);
																	clone.domain = domain;
																	return clone;
																})
															.value();
			var maxDur = _.chain(primaryCriteria)
										.map(getMaxDuration)
										.max()
										.value();
			//console.log(maxDur);
			function rangeInfo(range, feature) {
				if (!range) 
					return;
				switch (feature) {
					case "max":
						if (range.Op() === "!bt")
							return; // no upper limit
					case "upper":
						//console.log(range.Extent(), range.Op(), range.Value());
						return range.Extent() || range.Value(); // Extent is high end for "bt"
					case "min":
						if (range.Op() === "!bt")
							return; // no lower limit
					case "lower":
					case "val":
						return range.Value();
					case "single-double":
						if (range.Op().match(/bt/))
							return 'double';
						return 'single';
					case "nice-op":
						switch (range.Op()) {
							case "lt":
								return "<";
							case "lte":
								return "<=";
							case "gt":
								return ">";
							case "gte":
								return ">=";
							case "eq":
								return "=";
							case "bt":
								return "between";
							case "!bt":
								return "not between";
						}
				}
			}
			function getRange(pc, feature) {
				var whichEnd;
				switch (feature) {
					case "dur":
						if ("EraLength" in pc) {
							return pc.EraLength();
						}
						switch (pc.domain) {
							case "DrugExposure":
								return pc.DaysSupply();
							case "ObservationPeriod":
								return pc.PeriodLength();
							case "VisitOccurrence":
								return pc.VisitLength();
						}
						return;
					case "start":
						whichEnd = 'StartDate';
						break;
					case "end":
						whichEnd = 'EndDate';
						break;
				}
				if (pc.EraLength)
					return pc['Era' + whichEnd]();
				if (pc.domain === 'ObservationPeriod')
					return pc['Period' + whichEnd]();
				if (pc['Occurrence' + whichEnd])
					return pc['Occurrence' + whichEnd]();
			}
			function getMaxDuration(pc) {
				var range = getRange(pc, 'dur');
				if (range)
					return rangeInfo(range, 'max');
			}
			var conceptSets = expression().ConceptSets();
			function conceptName(crit) {
				return crit.CodesetId && crit.CodesetId() ? 
								conceptSets[crit.CodesetId()].name() : '';
			}
			function niceDomain(domain) {
				switch (domain) {
					case "ConditionOccurrence":
						return "condition";
					case "DrugExposure":
						return "drug";
					case "DrugEra":
						return "drug era";
					case "ConditionEra":
						return "condition era";
					case "DoseEra":
						return "dose era";
					case "ProcedureOccurrence":
						return "procedure";
					case "Observation":
						return "observation";
					case "DeviceExposure":
						return "device";
					case "Measurement":
						return "measurement";
					case "Specimen":
						return "specimen";
					case "Death":
						return "death";
					case "ObservationPeriod":
						return "observation period";
					case "VisitOccurrence":
						return "visit"
					default:
						return domain;
				}
			}
			function critLabel(crit) {
				var dom = niceDomain(crit.domain);
				var name = conceptName(crit);
				if (name)
					return `${dom}: ${name}`;
				return `any ${dom}`;
			}
			var prim = d3.select(element).selectAll('div.prim')
										.data(primaryCriteria)
										.enter()
										.append('div')
											.attr('class','prim');
			prim.each(function(pc) {
				var pcDiv = d3.select(this);
				/*
				 * was thinking of side-by-side divs, but now not doing that
				pcDiv.append('div')
							.attr('class', 'pclabel')
							.text(pcCartoonText);
				*/
				var cartoonDiv = pcDiv.append('div')
							.attr('class', 'pc-cartoon')
							//.style('padding-bottom', (aspectRatio() * 100) + '%')
							.style('font-size', '15px')
							//.html(pcCartoonText)

				var svg = cartoonDiv.append("svg")
					//.attr("preserveAspectRatio", "xMinYMin meet")
					.attr('width', divWidth())
					.attr('height', cartoonHeight)
					//.style('height', cartoonHeight + 'px!important')
					//.attr("viewBox", `0 0 ${cartoonWidth()} ${cartoonHeight}`)
				svg.call(pcCartoon);
				//xScale.range([0, width]);

			});
			function pcCartoon(selection) {
				/*
				selection.append('line')
							.attr('y1', cartoonHeight / 2)
							.attr('y2', cartoonHeight / 2)
							.attr('x2', divWidth())
							.style('stroke-width', cartoonHeight / 20)
							.attr('stroke-dasharray', '3,3')
				*/
				//var bracket = d3.select("svg").selectAll("path").attr("class","curlyBrace").data(coords);
				//bracket.enter().append("path").attr("class","curlyBrace");
				//bracket.attr("d", function(d) { return makeCurlyBrace(d.x1,d.y1,d.x2,d.y2,50,0.6); });

				selection//.filter(pc=>getRange(pc, 'start'))
						.each(function(pc) {
							var curlyStart = sections.start.offset;
							var curlyEnd = sections.end.offset;

							var startRange = getRange(pc, 'start');
							if (startRange) {
								if (['lt','lte','!bt'].indexOf(startRange.Op()) > -1) {
									d3.select(this).append('text')
												.attr('y', line(6))
												.attr('x', xScale(sections.start.offset))
												.style('font-size', '15px')
												.text(`start ${rangeInfo(startRange, 'nice-op')} ${startRange.Value()}`);
									d3.select(this).append('line')
												.attr('y1', line(5.7))
												.attr('y2', line(5.7))
												.attr('x1', xScale(sections.prestart.offset))
												.attr('x2', xScale(sections.start.offset))
												//.style('stroke-width', cartoonHeight / 20)
												.attr('stroke-dasharray', '3,3')
												.style('marker-start', 'url(#left-arrow)')
								}
								if (['gt','gte','!bt'].indexOf(startRange.Op()) > -1) {
									d3.select(this).append('text')
												.attr('y', line(6))
												.attr('x', xScale(sections.start.offset))
												.attr('text-anchor', 'end')
												.style('font-size', '15px')
												.text(`start ${rangeInfo(startRange, 'nice-op')} ${startRange.Value()}`);
									d3.select(this).append("text")
												.attr('y', line(6))
												.attr('x1', xScale(sections.start.offset))
											  .attr("font-family","FontAwesome")
												  //.attr('font-size', function(d) { return '70px';} )
												.text('\uf0a4')
									d3.select(this).append('line')
												.attr('y1', line(5.7))
												.attr('y2', line(5.7))
												.attr('x1', xScale(sections.start.offset))
												.attr('x2', xScale(sections.poststart.offset))
												//.style('stroke-width', cartoonHeight / 20)
												.attr('stroke-dasharray', '3,3')
												.style('marker-end', 'url(#right-arrow)')
								}
							}
							var endRange = getRange(pc, 'end');
							if (endRange) {
								if (['lt','lte','!bt'].indexOf(endRange.Op()) > -1) {
									d3.select(this).append('text')
												.attr('y', line(6))
												.attr('x', xScale(sections.end.offset))
												.style('font-size', '15px')
												.text(`end ${rangeInfo(endRange, 'nice-op')} ${endRange.Value()}`);
									d3.select(this).append('line')
												.attr('y1', line(5.7))
												.attr('y2', line(5.7))
												.attr('x1', xScale(sections.preend.offset))
												.attr('x2', xScale(sections.end.offset))
												//.style('stroke-width', cartoonHeight / 20)
												.attr('stroke-dasharray', '3,3')
												.style('marker-start', 'url(#left-arrow)')
								}
								if (['gt','gte','!bt'].indexOf(endRange.Op()) > -1) {
									d3.select(this).append('text')
												.attr('y', line(6))
												.attr('x', xScale(sections.end.offset))
												.attr('text-anchor', 'end')
												.style('font-size', '15px')
												.text(`end ${rangeInfo(endRange, 'nice-op')} ${endRange.Value()}`);
									d3.select(this).append('line')
												.attr('y1', line(5.7))
												.attr('y2', line(5.7))
												.attr('x1', xScale(sections.end.offset))
												.attr('x2', xScale(sections.postend.offset))
												//.style('stroke-width', cartoonHeight / 20)
												.attr('stroke-dasharray', '3,3')
												.style('marker-end', 'url(#right-arrow)')
								}
							}
							d3.select(this).append('path').attr('class','curlyBrace')
								.attr('d', makeCurlyBrace(
																					xScale(curlyEnd),
																					line(4),
																					xScale(curlyStart),
																					line(4),
																					line(2),
																					//15,
																					0.6));
							d3.select(this).append('text')
										.attr('y', line(2))
										.attr('x', xScale((curlyStart + curlyEnd)/2))
										.attr('text-anchor', 'middle')
										.style('font-size', '15px')
										.text(critLabel(pc))

							var durRange = getRange(pc, 'dur');
							if (durRange) {
								/*
								if (rangeInfo(durRange, 'single-double') == 'single') {
									dur = `${rangeInfo(durRange, 'nice-op')} ${rangeInfo(durRange, 'val')} days`;
								} else {
									dur = `${rangeInfo(durRange, 'nice-op')} ${rangeInfo(durRange, 'lower')} and ${rangeInfo(durRange, 'upper')} days`;
								}
								*/
								if (['lt','lte'].indexOf(durRange.Op()) > -1) {
									d3.select(this).append('text')
												.attr('y', line(5))
												.attr('x', xScale(sections.end.offset))
												.style('font-size', '15px')
												.text(`duration ${rangeInfo(durRange, 'nice-op')} ${durRange.Value()} days`);
								}
								if (['gt','gte'].indexOf(durRange.Op()) > -1) {
									d3.select(this).append('text')
												.attr('y', line(5))
												.attr('x', xScale(sections.end.offset))
												.attr('text-anchor', 'end')
												.style('font-size', '15px')
												.text(`duration ${rangeInfo(durRange, 'nice-op')} ${durRange.Value()} days`);
								}
							}
						})
			}
			function pcCartoonText(pc) {
				var durRange = getRange(pc, 'dur');
				var dur = 'any duration';
				if (durRange) {
					if (rangeInfo(durRange, 'single-double') == 'single') {
						dur = `${rangeInfo(durRange, 'nice-op')} ${rangeInfo(durRange, 'val')} days`;
					} else {
						dur = `${rangeInfo(durRange, 'nice-op')} ${rangeInfo(durRange, 'lower')} and ${rangeInfo(durRange, 'upper')} days`;
					}
				}
				var startRange = getRange(pc, 'start');
				var start = 'any time';
				if (startRange) {
					start = `${rangeInfo(startRange, 'nice-op')} ${rangeInfo(startRange, 'val')}`;
				}

				var endRange = getRange(pc, 'end');
				var end = 'any time';
				if (endRange) {
					end = `${rangeInfo(endRange, 'nice-op')} ${rangeInfo(endRange, 'val')}`;
				}

				return `start ${start}, end ${end}, ${dur}`;
			}

			return;

			var scale = d3.scale.linear()
										.domain([domain.min, domain.max])
										.range([0.10 * width, 0.85 * width]);


			var primCritLabels = _.chain(primaryCriteria)
														.map(_.pairs)
														.flatten()
														.map(d=>`${d[0]}: ${d[1].CodesetId && d[1].CodesetId() ? 
																	expression().ConceptSets()[d[1].CodesetId()].name() : 'any'}`)
														.value();
			d3.select(element).selectAll('div.primary-criteria')
				.data(primCritLabels)
				.enter()
				.append('div')
					.classed('primary-criteria','true')
					.text(d=>d);

			var svg = d3.select(element).select('svg');
			//svg.select('g.primary').remove();
			svg.selectAll('g').remove();
			var g =svg.append('g')
								.attr('class','primary')
								.attr('transform', `translate(0,${lineHeight})`)

			g.append('rect')
					.attr('width', width * 0.9)
					.attr('height', line(2))
					.attr('y', -8)
					//.attr('y', function(d,i) { return lineHeight * (i - 0.5); })
					//.style('fill-opacity', 0.2)
					//.style('stroke','white')
					//.style('stroke-width', 2)
					.classed('highlighted', function(d) {
						return expression().PrimaryCriteria() === selectedFragment();
					})
					.on('mouseover', function(d) {
						selectedFragment(expression().PrimaryCriteria());
					})
					.on('mouseout', function(d) {
						// DOESN'T FIRE, don't know why
						selectedFragment(null);
					})
			g.append('text')
					.attr('y', 5)
					.attr('x', 5)
					.text('Primary Criteria')
			g.append('line')
					.attr('x1', scale(-expression().PrimaryCriteria()
												.ObservationWindow.PriorDays())) 
					.attr('x2', scale(expression().PrimaryCriteria()
												.ObservationWindow.PostDays()))
					.attr('y1', 18)
					.attr('y2', 18)
					.attr('stroke-width', 4)
					//.attr('fill', 'pink')
					//.attr('stroke', 'blue')
					.style('marker-start', 'url(#left-arrow)')
					.style('marker-end', 'url(#right-arrow)')
			g.append('circle')
					.attr('r', 4)
					.attr('cx', scale(0))
					.attr('cy', 18)
					.style('fill','brown')
					.style('stroke','black')

			drawCartoon(g, criteriaGroup, 2, scale, selectedFragment, primaryWindow)
		}
	};
	/* broken now because adding fields to json causes error in generating sql
	function criteriaGroupWalk(criteriaGroup, cb, parentKey) {
		var list = criteriaGroup ? criteriaGroup.CriteriaList() : [];
		for (var i = 0; i < list.length; i++) {
			var key = [i + 1];
			if (parentKey)
				key.unshift(parentKey);
			key = key.join('.');
			list[i].key = key;
			cb(list[i], key);
		}
		var groups = criteriaGroup ? criteriaGroup.Groups() : [];
		for (var i = 0; i < groups.length; i++) {
			var key = [list.length + i + 1];
			if (parentKey)
				key.unshift(parentKey);
			key = key.join('.');
			criteriaGroupWalk(groups[i], cb, key);
		}
	}
	*/
	function drawCartoon(selection, data, linesdown, scale, selectedFragment, primaryWindow) {
			var morelines = 0;
			var g = selection
							.append('g')
								.attr('class','additional')
								.attr('transform', `translate(0,${linesdown*lineHeight})`)
			g.selectAll('g.additional')
							.data(data ? data.CriteriaList() : [])
								.enter()
							.append('g')
								.attr('class','additional')
			g.selectAll('g.additional')
				.append('rect')
					.attr('width', width * 0.9)
					.attr('height', lineHeight)
					.attr('y', function(d,i) { return lineHeight * (i - 0.5); })
					//.style('fill-opacity', 0.2)
					//.style('stroke','white')
					//.style('stroke-width', 2)
					.classed('highlighted', function(d) {
						return d === selectedFragment();
					})
					.on('mouseover', function(d) {
						selectedFragment(d);
					})
					.on('mouseout', function(d) {
						// DOESN'T FIRE, don't know why
						selectedFragment(null);
					})
			g.selectAll('g.additional')
							.append('line')
								.style('marker-start', function(cg) {
									var days = cg.StartWindow.Start.Days();
									if (days === null) {
										return 'url(#left-arrow)';
									}
									return 'url(#line-stop)';
								})
								.style('marker-end', function(cg) {
									var days = cg.StartWindow.End.Days();
									if (days === null) {
										return 'url(#right-arrow)';
									}
									return 'url(#line-stop)';
								})
								.attr('x1', function(cg) {
									var days = cg.StartWindow.Start.Days();
									var coeff = cg.StartWindow.Start.Coeff();
									if (days === null) {
										if (coeff < 0)
											return scale(primaryWindow.min);
										else
											return scale(primaryWindow.max);
									}
									return scale(days * coeff);
								})
								.attr('x2', function(cg) {
									var days = cg.StartWindow.End.Days();
									var coeff = cg.StartWindow.End.Coeff();
									if (days === null) {
										if (coeff < 0)
											return scale(primaryWindow.min);
										else
											return scale(primaryWindow.max);
									}
									return scale(days * coeff);
								})
								.attr('y1', function(d,i) { return i*lineHeight;})
								.attr('y2', function(d,i) { return i*lineHeight;})
								.attr('stroke-width', 4)
								/*
								.classed('highlighted', function(d) {
									return d === selectedFragment();
								})
								.on('mouseover', function(d) {
									selectedFragment(d);
								})
								*/
			/*
			g.selectAll('g.additional')
				.append('text')
					//.attr('x', -20)
					.attr('y', function(d,i) { return lineHeight * (0.26+i); })
					.attr('x', 5)
					.text(function(d) { 
						return d.key;
					})
			*/
			var groups = data ? data.Groups() : [];
			for (var i = 0; i < groups.length; i++) {
				drawCartoon(g, groups[i], data.CriteriaList().length + 2*i, scale, selectedFragment, primaryWindow);
			}
	}
		//returns path string d for <path d="This string">
		//a curly brace between x1,y1 and x2,y2, w pixels wide 
		//and q factor, .5 is normal, higher q = more expressive bracket 
		function makeCurlyBrace(x1,y1,x2,y2,w,q)
		{
			//Calculate unit vector
			var dx = x1-x2;
			var dy = y1-y2;
			var len = Math.sqrt(dx*dx + dy*dy);
			dx = dx / len;
			dy = dy / len;

			//Calculate Control Points of path,
			var qx1 = x1 + q*w*dy;
			var qy1 = y1 - q*w*dx;
			var qx2 = (x1 - .25*len*dx) + (1-q)*w*dy;
			var qy2 = (y1 - .25*len*dy) - (1-q)*w*dx;
			var tx1 = (x1 -  .5*len*dx) + w*dy;
			var ty1 = (y1 -  .5*len*dy) - w*dx;
			var qx3 = x2 + q*w*dy;
			var qy3 = y2 - q*w*dx;
			var qx4 = (x1 - .75*len*dx) + (1-q)*w*dy;
			var qy4 = (y1 - .75*len*dy) - (1-q)*w*dx;

			return ( "M " +  x1 + " " +  y1 +
								" Q " + qx1 + " " + qy1 + " " + qx2 + " " + qy2 + 
								" T " + tx1 + " " + ty1 +
								" M " +  x2 + " " +  y2 +
								" Q " + qx3 + " " + qy3 + " " + qx4 + " " + qy4 + 
								" T " + tx1 + " " + ty1 );
		}

		function update() {
			var bracket = d3.select("svg").selectAll("path").attr("class","curlyBrace").data(coords);
		
			bracket.enter().append("path").attr("class","curlyBrace");
			bracket.attr("d", function(d) { return makeCurlyBrace(d.x1,d.y1,d.x2,d.y2,50,0.6); });
			bracket.exit().remove();
		
			coords.shift();
		}

});
