"use strict";
define(['knockout','d3', 'lodash'], function (ko, d3, _) {
	window.d3 = d3;
	var width = 400;
	var height = 450;

	var expression = {};
	var conceptSets = [];
	var _sections = [
		{name: 'prestart',  width: 15 }, // 10 em? for <starts after> date
		{name: 'start',     width:	10 }, // indeterminate time between prim crit date and index date
		{name: 'poststart', width: 15 }, // for <starts before> date
		{name: 'dur',       width: 45, adjust: -15 }, // should line up with end of start region
		{name: 'preend',    width: 15, adjust: -15 }, // for <ends after> date
		{name: 'end',       width:	10 },
		{name: 'postend',   width: 15 }, //for <ends before> date
		{name: 'extra',     width: 10 },
	];
	var sections = {};
	var pcScale = d3.scale.linear();
	var obScale = d3.scale.linear();
	function sectionCalc(obswin) {
		var offset = 0;
		_.each(_sections, section => {
			section.offset = offset + (section.adjust || 0);
			offset += section.width;
			offset += (section.adjust || 0);
			sections[section.name] = section;
		});
		if (obswin && !_.isEmpty(expression)) {
			var prior = Math.abs(expression.PrimaryCriteria().ObservationWindow.PriorDays());
			var post = expression.PrimaryCriteria().ObservationWindow.PostDays();
			var leftOfIndex = prior / (prior + post);
			var rightOfIndex = post / (prior + post);
			if (leftOfIndex < .25) {
				leftOfIndex = .25;
				rightOfIndex = .75;
			}
			if (rightOfIndex < .25) {
				rightOfIndex = .25;
				leftOfIndex = .75;
			}
		}
		pcScale.domain([-pcWidth(sections) / leftOfIndex - sections.prestart.offset, 
											pcWidth(sections)]);
		obScale.domain([-prior, post]);
	}
	function pcWidth(sections) {
		if (sections.postend.offset) {
			return sections.postend.offset + sections.postend.width;
		}
		return _.chain(sections).map(d=>d.width).sum().value() +
					 _.chain(sections).map(d=>d.adjust).sum().value();
	}
	var lineHeight = 15;
	var textLinesBeforeBrace = 1;
	var braceLines = 2;
	var textLinesAfterBrace = 2;
	var cartoonHeight = // lineHeight * 8; // 6 lines, 15px high?
		function(hasDuration) {
			return (textLinesBeforeBrace + textLinesAfterBrace +
							(hasDuration ? braceLines : 0)) * lineHeight;
		};
	function line(section, hasDur, num = 0) {
		var bl = hasDur ? braceLines : 0;
		return (section === 'before' ? num :
						section === 'brace'  ? textLinesBeforeBrace + bl :
						section === 'after'  ? textLinesBeforeBrace + bl + num : NaN) *
					 lineHeight;
		//return lineHeight * num;
	}
	function ypos(what, hasDur) {
		switch(what) {
			case 'startdate':
			case 'enddate':
				return line('after', hasDur, 2);
			case 'startarrow':
			case 'endarrow':
				return line('after', hasDur, 1.7);
			case 'dur':
				return line('after', hasDur, 1);
			case 'durarrow':
				return line('after', hasDur, .7);
			case 'label':
				return line('before', hasDur, 1);
			case 'brace':
				return line('brace', hasDur);
		}
	}

	function obsWindow() {
		var criteriaGroup = expression.AdditionalCriteria();
		var domain = {
			min: -expression.PrimaryCriteria().ObservationWindow.PriorDays(), 
			max: expression.PrimaryCriteria().ObservationWindow.PostDays()
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
		criteriaGroupWalk(criteriaGroup, getEndPoints); // broken
		return domain;
	}
	function criteriaGroupWalk(criteriaGroup, cb, parentKey) {
		var list = criteriaGroup ? criteriaGroup.CriteriaList() : [];
		for (var i = 0; i < list.length; i++) {
			/* key stuff
			 * broken now because adding fields to json causes error in generating sql
			 * and not using the fragment highlighting right now anyway 
			var key = [i + 1];
			if (parentKey)
				key.unshift(parentKey);
			key = key.join('.');
			list[i].key = key;
			cb(list[i], key);
			*/
			cb(list[i]);
		}
		var groups = criteriaGroup ? criteriaGroup.Groups() : [];
		for (var i = 0; i < groups.length; i++) {
			/*
			var key = [list.length + i + 1];
			if (parentKey)
				key.unshift(parentKey);
			key = key.join('.');
			criteriaGroupWalk(groups[i], cb, key);
			*/
			criteriaGroupWalk(groups[i], cb);
		}
	}
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
	function durationType(crit) {
		if ("EraLength" in crit) {
			return "duration";
		}
		switch (crit.domain) {
			case "DrugExposure":
				return "days supply";
			case "ObservationPeriod":
			case "VisitOccurrence":
				return "duration";
		}
	}
	function getRange(crit, feature) {
		var whichEnd;
		switch (feature) {
			case "dur":
				if ("EraLength" in crit) {
					return crit.EraLength();
				}
				switch (crit.domain) {
					case "DrugExposure":
						return crit.DaysSupply();
					case "ObservationPeriod":
						return crit.PeriodLength();
					case "VisitOccurrence":
						return crit.VisitLength();
				}
				return;
			case "start":
				whichEnd = 'StartDate';
				break;
			case "end":
				whichEnd = 'EndDate';
				break;
		}
		if (crit.EraLength)
			return crit['Era' + whichEnd]();
		if (crit.domain === 'ObservationPeriod')
			return crit['Period' + whichEnd]();
		if (crit['Occurrence' + whichEnd])
			return crit['Occurrence' + whichEnd]();
	}
	function getMaxDuration(crit) {
		var range = getRange(crit, 'dur');
		if (range)
			return rangeInfo(range, 'max');
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
	function conceptName(crit) {
		return crit.CodesetId && crit.CodesetId() ? 
						conceptSets[crit.CodesetId()].name() : '';
	}
	function critLabel(crit) {
		var dom = niceDomain(crit.domain);
		var name = conceptName(crit);
		if (name)
			return `${dom}: ${name}`;
		return `any ${dom}`;
	}

	var divWidth = ko.observable();

	ko.bindingHandlers.cohortExpressionCartoon = {
		init: function (element, valueAccessor, allBindingsAccessor) {
			expression = valueAccessor().expression();
			//var selectedFragment = valueAccessor().selectedFragment; // no longer using

			// update when do element is displayed and has width
			$(element).parents('.tab-pane').bind("DOMSubtreeModified", function() {
				divWidth(element.offsetWidth);
				pcScale.range([0, element.offsetWidth]);
				obScale.range([0, element.offsetWidth]);
			});

			setupArrowHeads(element);

		},
		update: function (element, valueAccessor, allBindingsAccessor) {
			if (!divWidth()) {
				return;
			}
			//console.log(valueAccessor().tabPath());
			ko.toJSON(valueAccessor().expression); // force update on expression change

			if (valueAccessor().tabPath() !== "export/printfriendly") {
				return;
			}
			if (!valueAccessor().delayedCartoonUpdate()) {
				setTimeout(function() {
					//console.log('wait for dom');
					// force update after dom is displayed
					valueAccessor().delayedCartoonUpdate("wait for dom");
				}, 20);
				return;
			}
			if (valueAccessor().delayedCartoonUpdate() === 'wait for dom') {
				valueAccessor().delayedCartoonUpdate(null);
				//console.log('resetting delay');
			}
			//console.log('rendering cartoon');
			//console.log("offset width", element.offsetWidth);

			window.expression = expression = valueAccessor().expression();
			var obswin = obsWindow();
			console.log(obswin);
			sectionCalc(obswin);
			conceptSets = expression.ConceptSets();


			//var selectedFragment = valueAccessor().selectedFragment; // not using

			drawPrimaryCriteria(element);
			drawObservationPeriod(element);
			/*
			var maxDur = _.chain(pcList)
										.map(getMaxDuration)
										.max()
										.value();
			//console.log(maxDur);
			*/

			return;

			/*
			var scale = d3.scale.linear()
										.domain([domain.min, domain.max])
										.range([0.10 * width, 0.85 * width]);


			var primCritLabels = _.chain(pcList)
														.map(_.pairs)
														.flatten()
														.map(d=>`${d[0]}: ${d[1].CodesetId && d[1].CodesetId() ? 
																	expression.ConceptSets()[d[1].CodesetId()].name() : 'any'}`)
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
						return expression.PrimaryCriteria() === selectedFragment();
					})
					.on('mouseover', function(d) {
						selectedFragment(expression.PrimaryCriteria());
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
					.attr('x1', scale(-expression.PrimaryCriteria()
												.ObservationWindow.PriorDays())) 
					.attr('x2', scale(expression.PrimaryCriteria()
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
			*/
		}
	};
	function drawCartoonNOTBEINGUSED(selection, data, linesdown, scale, selectedFragment, primaryWindow) {
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
	function makeCurlyBrace(x1,y1,x2,y2,w,q) {
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
							" T " + tx1 + " " + ty1 )//+
							//" M " +  x2 + " " +  y2 +
							//" Q " + qx3 + " " + qy3 + " " + qx4 + " " + qy4 + 
							//" T " + tx1 + " " + ty1 );
	}

	function setupArrowHeads(element) {
		var svg = d3.select(element).append('svg')
									//.attr('width',width)
									.attr('height',0)
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
				.attr('markerWidth', 2)
				.attr('markerHeight', 10)
				.attr('fill','steelblue')
				.attr('orient', 'auto')
				.append('path')
					.attr('d', 'M 0 0 L 1 0 L 1 10 L 0 10 z')
	}
	function pcCartoon(selection) {
		selection//.filter(pc=>getRange(pc, 'start'))
				.each(function(pc) {
					var hasDur = !!durationType(pc);
					var curlyStart = sections.start.offset;
					var curlyEnd = sections.end.offset;

					var startRange = getRange(pc, 'start');
					if (startRange) {
						d3.select(this).append("text")
									.attr('y', ypos('startdate', hasDur))
									.attr('x', pcScale(sections.start.offset))
									.attr("font-family","FontAwesome")
									.attr('text-anchor', 'middle')
									.text('\uf006') // star
						if (['lt','lte','!bt'].indexOf(startRange.Op()) > -1) {
							d3.select(this).append('text')
										.attr('y', ypos('startdate', hasDur))
										.attr('x', pcScale(sections.start.offset) + lineHeight/2)
										.style('font-size', '15px')
										.text(`${rangeInfo(startRange, 'nice-op')} ${startRange.Value()}`);
							d3.select(this).append('line')
										.attr('y1', ypos('startarrow', hasDur))
										.attr('y2', ypos('startarrow', hasDur))
										.attr('x1', pcScale(sections.prestart.offset))
										.attr('x2', pcScale(sections.start.offset) - lineHeight/2)
										.attr('stroke-dasharray', '3,3')
										.style('marker-start', 'url(#left-arrow)')
						}
						if (['gt','gte','!bt'].indexOf(startRange.Op()) > -1) {
							d3.select(this).append('text')
										.attr('y', ypos('startdate', hasDur))
										.attr('x', pcScale(sections.start.offset) - lineHeight/2)
										.attr('text-anchor', 'end')
										.style('font-size', '15px')
										.text(`${rangeInfo(startRange, 'nice-op')} ${startRange.Value()}`);
							d3.select(this).append('line')
										.attr('y1', ypos('startarrow', hasDur))
										.attr('y2', ypos('startarrow', hasDur))
										.attr('x1', pcScale(sections.start.offset) + lineHeight/2)
										.attr('x2', pcScale(sections.poststart.offset))
										.attr('stroke-dasharray', '3,3')
										.style('marker-end', 'url(#right-arrow)')
						}
					}
					var endRange = getRange(pc, 'end');
					if (endRange) {
						d3.select(this).append("text")
									.attr('y', ypos('startdate', hasDur))
									.attr('x', pcScale(sections.end.offset))
									.attr("font-family","FontAwesome")
									.attr('text-anchor', 'middle')
									.text('\uf256') // stop
						if (['lt','lte','!bt'].indexOf(endRange.Op()) > -1) {
							d3.select(this).append('text')
										.attr('y', ypos('enddate', hasDur))
										.attr('x', pcScale(sections.end.offset) + lineHeight/2)
										.style('font-size', '15px')
										.text(`${rangeInfo(endRange, 'nice-op')} ${endRange.Value()}`);
							d3.select(this).append('line')
										.attr('y1', ypos('endarrow', hasDur))
										.attr('y2', ypos('endarrow', hasDur))
										.attr('x1', pcScale(sections.preend.offset))
										.attr('x2', pcScale(sections.end.offset) - lineHeight/2)
										.attr('stroke-dasharray', '3,3')
										.style('marker-start', 'url(#left-arrow)')
						}
						if (['gt','gte','!bt'].indexOf(endRange.Op()) > -1) {
							d3.select(this).append('text')
										.attr('y', ypos('enddate', hasDur))
										.attr('x', pcScale(sections.end.offset) - lineHeight/2)
										.attr('text-anchor', 'end')
										.style('font-size', '15px')
										.text(`${rangeInfo(endRange, 'nice-op')} ${endRange.Value()}`);
							d3.select(this).append('line')
										.attr('y1', ypos('endarrow', hasDur))
										.attr('y2', ypos('endarrow', hasDur))
										.attr('x1', pcScale(sections.end.offset) + lineHeight/2)
										.attr('x2', pcScale(sections.postend.offset))
										.attr('stroke-dasharray', '3,3')
										.style('marker-end', 'url(#right-arrow)')
						}
					}
					d3.select(this).append("text")
								.attr('y', ypos('label', hasDur))
								.attr('x', pcScale(sections.start.offset))
								.attr("font-family","FontAwesome")
								.attr('text-anchor', 'middle')
								//.text('\uf0a4') // right pointing finger
								.text('\uf006') // star
					d3.select(this).append('text')
								.attr('y', ypos('label', hasDur))
								//.attr('x', pcScale((curlyStart + curlyEnd)/2))
								//.attr('text-anchor', 'middle')
								.attr('x', pcScale(sections.start.offset) + lineHeight/2)
								.style('font-size', '15px')
								.text(critLabel(pc))
					d3.select(this).append('text')
								.attr('x', divWidth() - 15)
								.attr('y', ypos('label', hasDur))
								.attr('text-anchor', 'end')
								.attr('class', 'pclabel')
								.text(pcCartoonText(pc));

					if (durationType(pc)) {
						var durRange = getRange(pc, 'dur');
						var brace = d3.select(this).append('path').attr('class','curlyBrace')
							.attr('d', makeCurlyBrace(
																				pcScale(curlyEnd),
																				ypos('brace', hasDur),
																				pcScale(curlyStart),
																				ypos('brace', hasDur),
																				braceLines * lineHeight,
																				//15,
																				0.6));
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
											.attr('y', ypos('dur', hasDur))
											.attr('x', pcScale(sections.end.offset) + lineHeight/2)
											.style('font-size', '15px')
											.text(`duration ${rangeInfo(durRange, 'nice-op')} ${durRange.Value()} days`);
								d3.select(this).append('line')
											.attr('y1', ypos('durarrow', hasDur))
											.attr('y2', ypos('durarrow', hasDur))
											.attr('x1', pcScale(sections.preend.offset))
											.attr('x2', pcScale(sections.end.offset) - lineHeight/2)
											.attr('stroke-dasharray', '3,3')
											.style('marker-start', 'url(#left-arrow)')
							}
							if (['gt','gte'].indexOf(durRange.Op()) > -1) {
								d3.select(this).append('text')
											.attr('y', ypos('dur', hasDur))
											.attr('x', pcScale(sections.end.offset) - lineHeight/2)
											.attr('text-anchor', 'end')
											.style('font-size', '15px')
											.text(`duration ${rangeInfo(durRange, 'nice-op')} ${durRange.Value()} days`);
								d3.select(this).append('line')
											.attr('y1', ypos('durarrow', hasDur))
											.attr('y2', ypos('durarrow', hasDur))
											.attr('x1', pcScale(sections.end.offset) + lineHeight/2)
											.attr('x2', pcScale(sections.postend.offset))
											.attr('stroke-dasharray', '3,3')
											.style('marker-end', 'url(#right-arrow)')
							}
							if (durRange.Op() === 'eq') {
								d3.select(this).append('text')
											.attr('y', ypos('dur', hasDur))
											.attr('x', pcScale(sections.end.offset) + lineHeight/2)
											.style('font-size', '15px')
											.text(`duration ${rangeInfo(durRange, 'nice-op')} ${durRange.Value()} days`);
								d3.select(this).append('line')
											.attr('y1', ypos('durarrow', hasDur))
											.attr('y2', ypos('durarrow', hasDur))
											.attr('x1', pcScale(sections.start.offset))
											.attr('x2', pcScale(sections.end.offset))
											//.attr('stroke-dasharray', '3,3')
											.style('marker-start', 'url(#line-stop)')
											.style('marker-end', 'url(#line-stop)')
							}
						} else {
							brace.style('stroke-dasharray', '3,3');
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
	function drawPrimaryCriteria(element) {
		var pcList = _.chain(expression.PrimaryCriteria().CriteriaList())
														.map(_.pairs)
														.flatten()
														.map(d=>{
																var [domain, pc] = d;
																var clone = _.clone(pc);
																clone.domain = domain;
																return clone;
															})
														.value();

		var primDiv = d3.select(element).selectAll('div.cartoon-primary-criteria')
											.data([null]) // only create pc div once
											.enter()
											.append('div')
												.attr('class', 'cartoon-primary-criteria');

		primDiv.append('div') // only create pc header div once
							.attr('class', 'header');

		primDiv = d3.select(element).selectAll('div.cartoon-primary-criteria');

		var limitType = expression.PrimaryCriteria().PrimaryCriteriaLimit.Type();
		var limitMsg, pcCritMatch;
		var pcPlural = pcList.length === 1 ? '' : 's';
		switch (limitType) {
			case 'All':
				pcCritMatch = pcList.length === 1 ?
														'the following primary criterion' :
														`one of the following ${pcList.length} primary criteria`;
				limitMsg = `Results will be generated for every person event matching 
											${pcCritMatch}.`;
				break;
			case 'First':
			case 'Last':
				pcCritMatch = pcList.length === 1 ?
														'the following primary criterion' :
														`any of the following ${pcList.length} primary criteria`;
				limitMsg = `Results will be generated for the ${limitType.toLowerCase()}
											event matching 
											${pcCritMatch}.`;
		}
		primDiv.selectAll('div.header').html(limitMsg + 
			` Result index date${pcPlural} will be the start date${pcPlural} of the matching event${pcPlural}.`);

		var pcdivs = primDiv.selectAll('div.pc')
									.data(pcList);
		pcdivs.exit().remove();
		pcdivs.enter()
					.append('div')
						.attr('class','pc');
		pcdivs = primDiv.selectAll('div.pc');
		pcdivs.each(function(pc) {
			var pcDiv = d3.select(this);
			/*
				* was thinking of side-by-side divs, but now not doing that
			pcDiv.append('div')
						.attr('class', 'pclabel')
						.text(pcCartoonText);
			*/
			/*
			var cartoonDiv = pcDiv.append('div')
						.attr('class', 'pc-cartoon')
						//.style('padding-bottom', (aspectRatio() * 100) + '%')
						//.style('font-size', '15px')
						//.html(pcCartoonText)
			*/

			//var svg = cartoonDiv.append("svg")
			var svg = pcDiv.append("svg")
				//.attr("preserveAspectRatio", "xMinYMin meet")
				.attr('width', divWidth())
				.attr('height', cartoonHeight(durationType(pc)))
				//.attr("viewBox", `0 0 ${pcWidth()} ${cartoonHeight}`)
			svg.call(pcCartoon);
			//pcScale.range([0, width]);

		});
	}
	function drawObservationPeriod(element) {
		var opDiv = d3.select(element).selectAll('div.cartoon-observation-period')
											.data([null]) // only create once
											.enter()
											.append('div')
												.attr('class', 'cartoon-observation-period');

		opDiv.append('div') // only create header div once
							.attr('class', 'header');

		opDiv = d3.select(element).selectAll('div.cartoon-observation-period');

		var prior = Math.abs(expression.PrimaryCriteria().ObservationWindow.PriorDays());
		var post = expression.PrimaryCriteria().ObservationWindow.PostDays();

		if (!(prior || post)) {
			opDiv.html("No required observation period");
		}

		var brace = opDiv.append("svg")
				.attr('width', divWidth())
				.attr('height', 40)
			.append('path').attr('class','curlyBrace')

		brace.attr('d', makeCurlyBrace(
																obScale(-prior),
																0,
																obScale(post),
																0,
																40,
																0.6));
	}
});
