"use strict";
define(['knockout','d3', 'lodash'], function (ko, d3, _) {
	window.d3 = d3;
	var width = 400;
	var height = 450;

	var expression = {};
	var conceptSets = [];
	var _sections = [
		{name: 'prestart',  width: 15, adjust: -15 }, // 0 point at start
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
		/*
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
		*/
		// put index at center point, and 0 point of obscale
		pcScale.domain([-pcWidth(sections), pcWidth(sections)]);
		obScale.domain([-Math.max(Math.abs(obswin.min), obswin.max),
										 Math.max(Math.abs(obswin.min), obswin.max)]);
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
		return crit.CodesetId && crit.CodesetId() > -1 ? 
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

			var d3element = d3.select(element);
			drawCritCat(d3element, 'primary-section', expression.PrimaryCriteria());
			drawCritCat(d3element, 'obsperiod-section');
			drawCritCat(d3element, 'additional-section', expression.AdditionalCriteria(), 0);
			drawCritCat(d3element, 'inclusion-section', expression.InclusionRules(), 0);

			return;
			drawPrimaryCriteria(element);
			drawObservationPeriod(element, obswin);
			drawAdditionalCriteria(element, obswin);
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
	function makeCurlyBrace(x1,y1,x2,y2,w,q, pointx) {
		if (typeof pointx === "undefined") {
			return makeCurlyBraceHalf(x1,y1,x2,y2,w,q);
		}
		return makeCurlyBraceHalf(x1,y1,pointx + (pointx - x1),y2,w,q, 'left') + 
					 makeCurlyBraceHalf(pointx - (x2 - pointx),y1,x2,y2,w,q, 'right')
	}
	function makeCurlyBraceHalf(x1,y1,x2,y2,w,q,half) {
		if (x1 === x2 && y1 === y2) {
			// just draw line at x1
			return ( "M " + x1 + " " + y1 +
							 " L " + x1 + " " + (y1 + w));

		}
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

		var left =  "M " +  x1 + " " +  y1 +
							  " Q " + qx1 + " " + qy1 + " " + qx2 + " " + qy2 + 
							  " T " + tx1 + " " + ty1;
		var right = " M " +  x2 + " " +  y2 +
							  " Q " + qx3 + " " + qy3 + " " + qx4 + " " + qy4 + 
							  " T " + tx1 + " " + ty1;
		if (half === 'left')
			return left;
		if (half === 'right')
			return right;
		return left + right;
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
	function addCritCartoon(d3element, scale) {
		// expects a selection of divs w/ svgs, modified AdditionalCriteria objs attached
		d3element.selectAll('svg')
							//.datum( addCrit => addCrit.Criteria ) // doesn't work second time through, leave data undefined
							.call(criterionCartoon, scale);
		d3element.append('div')
			.html(addCrit => `${addCritOccurrenceText(addCrit)}<br/>
												${addCritWindowText(addCrit)}`);
	}
	function addCritOccurrenceText(ac) {
		ac = ko.toJS(ac);
		var oc = ac.Occurrence;
		return `with ${['exactly','at most','at least'][oc.Type]}
							${oc.Count} using ${oc.IsDistinct ? 'distinct' : 'all'} occurrences`;
	}
	function addCritWindowText(ac) {
		ac = ko.toJS(ac);
		var sw = ac.StartWindow;
		return `occurring between 
							${sw.Start.Days} days ${sw.Start.Coeff===-1 ? 'before' : 'after'} and
							${sw.End.Days} days ${sw.End.Coeff===-1 ? 'before' : 'after'} index`;
	}
	function criterionCartoon(selection, critScale) {
		// expects a selection of svgs with Criteria objs attached
		selection.each(function(crit) {
			if (crit.Criteria) { // or AdditionalCriteria objs
				crit = crit.Criteria;
			}
			var d3element = d3.select(this);
			var hasDur = !!durationType(crit);
			var curlyStart = sections.start.offset;
			var curlyEnd = sections.end.offset;

			var startRange = getRange(crit, 'start');
			if (startRange) {
				d3element.append("text")
							.attr('y', ypos('startdate', hasDur))
							.attr('x', critScale(sections.start.offset))
							.attr("font-family","FontAwesome")
							.attr('text-anchor', 'middle')
							.text('\uf006') // star
				if (['lt','lte','!bt'].indexOf(startRange.Op()) > -1) {
					d3element.append('text')
								.attr('y', ypos('startdate', hasDur))
								.attr('x', critScale(sections.start.offset) + lineHeight/2)
								.style('font-size', '15px')
								.text(`${rangeInfo(startRange, 'nice-op')} ${startRange.Value()}`);
					d3element.append('line')
								.attr('y1', ypos('startarrow', hasDur))
								.attr('y2', ypos('startarrow', hasDur))
								.attr('x1', critScale(sections.prestart.offset))
								.attr('x2', critScale(sections.start.offset) - lineHeight/2)
								.attr('stroke-dasharray', '3,3')
								.style('marker-start', 'url(#left-arrow)')
				}
				if (['gt','gte','!bt'].indexOf(startRange.Op()) > -1) {
					d3element.append('text')
								.attr('y', ypos('startdate', hasDur))
								.attr('x', critScale(sections.start.offset) - lineHeight/2)
								.attr('text-anchor', 'end')
								.style('font-size', '15px')
								.text(`${rangeInfo(startRange, 'nice-op')} ${startRange.Value()}`);
					d3element.append('line')
								.attr('y1', ypos('startarrow', hasDur))
								.attr('y2', ypos('startarrow', hasDur))
								.attr('x1', critScale(sections.start.offset) + lineHeight/2)
								.attr('x2', critScale(sections.poststart.offset))
								.attr('stroke-dasharray', '3,3')
								.style('marker-end', 'url(#right-arrow)')
				}
			}
			var endRange = getRange(crit, 'end');
			if (endRange) {
				d3element.append("text")
							.attr('y', ypos('startdate', hasDur))
							.attr('x', critScale(sections.end.offset))
							.attr("font-family","FontAwesome")
							.attr('text-anchor', 'middle')
							.text('\uf256') // stop
				if (['lt','lte','!bt'].indexOf(endRange.Op()) > -1) {
					d3element.append('text')
								.attr('y', ypos('enddate', hasDur))
								.attr('x', critScale(sections.end.offset) + lineHeight/2)
								.style('font-size', '15px')
								.text(`${rangeInfo(endRange, 'nice-op')} ${endRange.Value()}`);
					d3element.append('line')
								.attr('y1', ypos('endarrow', hasDur))
								.attr('y2', ypos('endarrow', hasDur))
								.attr('x1', critScale(sections.preend.offset))
								.attr('x2', critScale(sections.end.offset) - lineHeight/2)
								.attr('stroke-dasharray', '3,3')
								.style('marker-start', 'url(#left-arrow)')
				}
				if (['gt','gte','!bt'].indexOf(endRange.Op()) > -1) {
					d3element.append('text')
								.attr('y', ypos('enddate', hasDur))
								.attr('x', critScale(sections.end.offset) - lineHeight/2)
								.attr('text-anchor', 'end')
								.style('font-size', '15px')
								.text(`${rangeInfo(endRange, 'nice-op')} ${endRange.Value()}`);
					d3element.append('line')
								.attr('y1', ypos('endarrow', hasDur))
								.attr('y2', ypos('endarrow', hasDur))
								.attr('x1', critScale(sections.end.offset) + lineHeight/2)
								.attr('x2', critScale(sections.postend.offset))
								.attr('stroke-dasharray', '3,3')
								.style('marker-end', 'url(#right-arrow)')
				}
			}
			d3element.append("text")
						.attr('y', ypos('label', hasDur))
						.attr('x', critScale(sections.start.offset))
						.attr("font-family","FontAwesome")
						.attr('text-anchor', 'middle')
						//.text('\uf0a4') // right pointing finger
						.text('\uf006') // star
			d3element.append('text')
						.attr('y', ypos('label', hasDur))
						//.attr('x', critScale((curlyStart + curlyEnd)/2))
						//.attr('text-anchor', 'middle')
						.attr('x', critScale(sections.start.offset) + lineHeight/2)
						.style('font-size', '15px')
						.text(critLabel(crit))
			d3element.append('text')
						.attr('x', divWidth() - 15)
						.attr('y', ypos('label', hasDur))
						.attr('text-anchor', 'end')
						.attr('class', 'critlabel')
						.text(critCartoonText(crit));

			if (durationType(crit)) {
				var durRange = getRange(crit, 'dur');
				var brace = d3element.append('path').attr('class','curly-brace')
					.attr('d', makeCurlyBrace(
																		critScale(curlyEnd),
																		ypos('brace', hasDur),
																		critScale(curlyStart),
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
						d3element.append('text')
									.attr('y', ypos('dur', hasDur))
									.attr('x', critScale(sections.end.offset) + lineHeight/2)
									.style('font-size', '15px')
									.text(`duration ${rangeInfo(durRange, 'nice-op')} ${durRange.Value()} days`);
						d3element.append('line')
									.attr('y1', ypos('durarrow', hasDur))
									.attr('y2', ypos('durarrow', hasDur))
									.attr('x1', critScale(sections.preend.offset))
									.attr('x2', critScale(sections.end.offset) - lineHeight/2)
									.attr('stroke-dasharray', '3,3')
									.style('marker-start', 'url(#left-arrow)')
					}
					if (['gt','gte'].indexOf(durRange.Op()) > -1) {
						d3element.append('text')
									.attr('y', ypos('dur', hasDur))
									.attr('x', critScale(sections.end.offset) - lineHeight/2)
									.attr('text-anchor', 'end')
									.style('font-size', '15px')
									.text(`duration ${rangeInfo(durRange, 'nice-op')} ${durRange.Value()} days`);
						d3element.append('line')
									.attr('y1', ypos('durarrow', hasDur))
									.attr('y2', ypos('durarrow', hasDur))
									.attr('x1', critScale(sections.end.offset) + lineHeight/2)
									.attr('x2', critScale(sections.postend.offset))
									.attr('stroke-dasharray', '3,3')
									.style('marker-end', 'url(#right-arrow)')
					}
					if (durRange.Op() === 'eq') {
						d3element.append('text')
									.attr('y', ypos('dur', hasDur))
									.attr('x', critScale(sections.end.offset) + lineHeight/2)
									.style('font-size', '15px')
									.text(`duration ${rangeInfo(durRange, 'nice-op')} ${durRange.Value()} days`);
						d3element.append('line')
									.attr('y1', ypos('durarrow', hasDur))
									.attr('y2', ypos('durarrow', hasDur))
									.attr('x1', critScale(sections.start.offset))
									.attr('x2', critScale(sections.end.offset))
									//.attr('stroke-dasharray', '3,3')
									.style('marker-start', 'url(#line-stop)')
									.style('marker-end', 'url(#line-stop)')
					}
				} else {
					brace.style('stroke-dasharray', '3,3');
				}
			}
		});
	}
	function pcCartoon(selection) {
		selection//.filter(pc=>getRange(pc, 'start'))
				.each(function(pc) {
				})
	}
	function critCartoonText(crit) {
		var durRange = getRange(crit, 'dur');
		var dur = 'any duration';
		if (durRange) {
			if (rangeInfo(durRange, 'single-double') == 'single') {
				dur = `${rangeInfo(durRange, 'nice-op')} ${rangeInfo(durRange, 'val')} days`;
			} else {
				dur = `${rangeInfo(durRange, 'nice-op')} ${rangeInfo(durRange, 'lower')} and ${rangeInfo(durRange, 'upper')} days`;
			}
		}
		var startRange = getRange(crit, 'start');
		var start = 'any time';
		if (startRange) {
			start = `${rangeInfo(startRange, 'nice-op')} ${rangeInfo(startRange, 'val')}`;
		}

		var endRange = getRange(crit, 'end');
		var end = 'any time';
		if (endRange) {
			end = `${rangeInfo(endRange, 'nice-op')} ${rangeInfo(endRange, 'val')}`;
		}

		return `start ${start}, end ${end}, ${dur}`;
	}
	function drawCritCat(d3element, cat, data, level) {
		if (Array.isArray(data))
			throw new Error("didn't expect array", data);
		// type in primary, additional, inclusion
		var funcs = {
			'primary-section':    { header: primaryCritHeader,    body: primaryCritBody },
			'additional-section': { header: addCritSectHeader,    body: addCritSectBody },
			//addcrit:            { header: additionalCritHeader, body: additionalCritBody },
			'critgroup':          { header: critGroupHeader,      body: critGroupBody },
			'inclusion-section':  { header: inclusionCritHeader,  body: inclusionCritBody },
			'obsperiod-section':  { header: obsperiodHeader,      body: obsperiodBody },
		};
		var catDiv = d3AddIfNeeded(d3element, [data], 'div', 
															 [`cartoon-${cat}`], 
																function(selection) { 
																	selection.append('div') // only create cat header div once
																						.attr('class', 'header');
																	selection.append('div') // only create cat header div once
																						.attr('class', 'body');
																});

		//if (!level) {
		funcs[cat].header(catDiv.select('div.header'), data);
		//}
		funcs[cat].body(catDiv.select('div.body'), data, level);
	}
	function addCritSectHeader(d3element, acsect, level) {
		var text = '<h3>Additional Criteria</h3>'; 
		d3element.html(text);
	}
	function addCritSectBody(d3element, acsect, level) {
		drawCritCat(d3element, 'critgroup', acsect, level);
	}
	function critGroupHeader(d3element, cg, level) {
		var text = '';
		text += `Restrict to people matching ${cg.Type().toLowerCase()} of the
							following criteria`;
		d3element.html(text);
	}
	function critGroupBody(d3element, cg, level) {
		var acList = critArray(cg, 'additional');
		var divs = d3AddIfNeeded(d3element, acList, 'div', ['crit'], 
									function(selection) { 
										selection.append('svg');
									})//.selectAll('svg');
		divs.selectAll('svg')
				.attr('width', divWidth())
				.attr('height', ac => cartoonHeight(durationType(ac.Criteria)))
		divs.call(addCritCartoon, pcScale);
		cg.Groups().forEach( group => {
			drawCritCat(d3element, 'critgroup', group, level + 1);
		});
	}
	function inclusionCritHeader(d3element, PrimaryCriteria, level) {
	}
	function inclusionCritBody(d3element, PrimaryCriteria, level) {
	}
	function critArray(data, cat) {
		if (cat === 'primary') {
			return _.chain(data.CriteriaList())
							.map(_.pairs)
							.flatten()
							.map(d=>{
									var [domain, pc] = d;
									var clone = _.clone(pc);
									clone.domain = domain;
									return clone;
								})
							.value();
		}
		return data.CriteriaList().map(addCrit=>{
							var domain = _.keys(addCrit.Criteria)[0];
							var clone = _.clone(addCrit);
							var critClone = _.clone(addCrit.Criteria[domain]);
							critClone.domain = domain;
							clone.Criteria = critClone;
							return clone;
						})
	}
	function primaryCritHeader(d3element, PrimaryCriteria) {
		var pcList = critArray(PrimaryCriteria, 'primary');
		var limitType = PrimaryCriteria.PrimaryCriteriaLimit.Type();
		var limitMsg = '<h3>Primary Criteria</h3>'; 
		var pcCritMatch;
		var pcPlural = limitType === 'All' ? 's' : '';
		switch (limitType) {
			case 'All':
				pcCritMatch = pcList.length === 1 ?
														'the following primary criterion' :
														`one of the following ${pcList.length} primary criteria`;
				limitMsg += `Results will be generated for every person event matching 
											${pcCritMatch}.`;
				break;
			case 'First':
			case 'Last':
				pcCritMatch = pcList.length === 1 ?
														'the following primary criterion' :
														`any of the following ${pcList.length} primary criteria`;
				limitMsg += `Results will be generated for the ${limitType.toLowerCase()}
											single event matching ${pcCritMatch}.`;
		}
		d3element.html(limitMsg + 
			` Result index date${pcPlural} will be the start date${pcPlural} of the matching event${pcPlural}.`);
	}
	function primaryCritBody(d3element, PrimaryCriteria) {
		var pcList = critArray(PrimaryCriteria, 'primary');
		var svgs = d3AddIfNeeded(d3element, pcList, 'div', ['crit'], 
									function(selection) { 
										selection.append('svg');
									}).selectAll('svg');
		svgs.attr('width', divWidth())
				.attr('height', pc => cartoonHeight(durationType(pc)))
				.call(criterionCartoon, pcScale);
	}
	function d3AddIfNeeded(parentElement, data, tag, classes, firstTimeCb) {
		var d3element;
		if (parentElement.selectAll) {
			d3element = parentElement;
		} else {
			d3element = d3.select(parentElement);
		}
		var selection = d3element.selectAll([tag].concat(classes).join('.'));
		if (Array.isArray(data)) {
			selection = selection.data(data);
		} else {
			selection = selection.datum(data);
			// or? selection = selection.data([data]);
		}
		selection.exit().remove();
		selection.enter().append(tag)
				.each(function(d) {
					var newNode = d3.select(this);
					classes.forEach(cls => {
						newNode.classed(cls, true);
					});
				})
				.call(firstTimeCb);
		selection = d3element.selectAll([tag].concat(classes).join('.'));
		return selection;
	}
	/*
	function drawCriteriaList(d3element, cl, level) {
		cl.forEach(criterion => {
			if (criterion.constructor.name === "AdditionalCriteria") {
				additionalCritCartoon(d3element, criterion);
				return;
			}
			if (criterion.constructor.name === "CriteriaGroup") {
				drawCriteriaGroup(d3element.node(), criterion, pcScale);
				return;
			}
			if (criterion.constructor.name === "object") {
				throw new Error("not using this, right?");
				criterionCartoon(d3element, criterion);
				return;
			}
			throw new Error("not sure what's in this list");
		});
	}
	*/
	function obsperiodHeader(d3element) {
		var prior = Math.abs(expression.PrimaryCriteria().ObservationWindow.PriorDays());
		var post = expression.PrimaryCriteria().ObservationWindow.PostDays();

		var text = "<h3>Observation Period</h3>";

		if (!(prior || post)) {
			d3element.html(text + "No required observation period");
			return;
		}
		text += `Required observation period from at least ${prior} days
								before to at least ${post} days after index date. `;

		var extra = [];
		var obswin = obsWindow();
		if (Math.abs(obswin.min) > Math.abs(prior)) {
			extra.push(Math.abs(obswin.min) + ' days before');
		}
		if (obswin.max > post) {
			extra.push(obswin.max + ' days after');
		}
		if (extra.length) {
			text += `Beyond the required observation period, additional criteria or 
									inclusion rules also reference events ${extra.join(' and ')} 
									index date.`;
		}
		d3element.html(text);
	}
	function obsperiodBody(d3element) {
		var obswin = obsWindow();
		var prior = Math.abs(expression.PrimaryCriteria().ObservationWindow.PriorDays());
		var post = expression.PrimaryCriteria().ObservationWindow.PostDays();
		if (!(prior || post)) {
			return;
		}
		var svg = d3element.selectAll('svg')
												.data([null]) // only create once
												.enter()
												.append("svg");

		svg.append('path').attr('class','curly-brace')
											.classed('first', true);
		svg.append('path').attr('class','curly-brace')
											.classed('second', true);

		svg = d3element.select("svg");
		svg.attr('width', divWidth())
				.attr('height', lineHeight * 3)

		svg.select('path.curly-brace.first').attr('d', makeCurlyBrace(
																obScale(-prior),
																.5 * lineHeight,
																obScale(post),
																.5 * lineHeight,
																lineHeight * 2,
																0.6,
																obScale(0) /*+ lineHeight/2*/)); 
		var extra = [];
		if (Math.abs(obswin.min) > Math.abs(prior)) {
			extra.push(Math.abs(obswin.min) + ' days before');
		}
		if (obswin.max > post) {
			extra.push(obswin.max + ' days after');
		}
		if (extra.length) {
			//svg.attr('height', lineHeight * 4.5);
			svg.select('path.curly-brace.second')
				.attr('d', makeCurlyBrace(
																	obScale(obswin.min),
																	.5 * lineHeight,
																	obScale(obswin.max),
																	.5 * lineHeight,
																	lineHeight * 2,
																	0.6,
																	obScale(0) /*+ lineHeight/2*/)) 
				.attr('stroke-dasharray', '3,3')
		}
	}
});
