"use strict";
define(['knockout','d3', 'lodash'], function (ko, d3, _) {

	var divWidth = ko.observable(); // triggers update
	//var cohdef; // ko.toJS(expression)
	var calScale, obsScale;

	function firstTimeSetup(element) {
		//expressionChangeSetup(element, cohdef);
		setupArrowHeads(element);
	}
	function expressionChangeSetup(element, cohdef) {
		cohdef.calScale.range([element.offsetWidth * .05, element.offsetWidth * .45]);
		cohdef.obsScale.range([element.offsetWidth * .05, element.offsetWidth * .45]);
		var d3element = d3.select(element);
		drawSection(d3element, cohdef, 'primary-section', cohdef.PrimaryCriteria);
		drawSection(d3element, cohdef, 'obsperiod-section');
		drawSection(d3element, cohdef, 'additional-section', cohdef.AdditionalCriteria, 0);
		drawSection(d3element, cohdef, 'inclusion-section', cohdef.InclusionRules, 0);
	}
	function dataSetup(expression) {
		window.expression = expression;
		var cohdef = ko.toJS(expression);
		window.cohdef = cohdef;

		// clone objects (so they can be modified) and add domain names
		addDomainNames(cohdef.PrimaryCriteria, 'primary');
		allGroups(cohdef).forEach(group=>addDomainNames(group, 'additional'))

		var allCriteria = allPlainCriteria(cohdef);
		cohdef.calScale = d3.time.scale()
												.domain(dateExtent(allCriteria));
		cohdef.calAxis = d3.svg.axis().orient('bottom').scale(cohdef.calScale);
		console.log(cohdef.calScale.domain());

		var allAddCrits = allAdditionalCriteria(cohdef);
		cohdef.obsScale = d3.scale.linear()
												.domain(obsExtent(
													cohdef.PrimaryCriteria.CriteriaList,allAddCrits));
		cohdef.obsAxis = d3.svg.axis().orient('bottom').scale(cohdef.obsScale);
		console.log(cohdef.obsScale.domain());
		return cohdef;
	}
	function allAdditionalCriteria(cohdef) {
		return (_.chain(allGroups(cohdef))
						 .map(d => d.CriteriaList)
						 .flatten()
						 .value());
	}
	function allPlainCriteria(cohdef) {
		return (cohdef.PrimaryCriteria.CriteriaList
						.concat(allAdditionalCriteria(cohdef).map(d=>d.Criteria)));
	}
	function allGroups(cohdef) {
		return (_.flatten([cohdef.AdditionalCriteria]
								.concat(cohdef.InclusionRules.map(d=>d.expression))
								.map(subGroups)));
	}
	function subGroups(group) { // returns array of this group and its subgroups
		if (group.Groups.length)
			return _.flatten([group].concat(group.Groups.map(subGroups)));
		return [group]
	}
	function dateExtent(crits) {
		var allDates = _.chain(crits)
										.map(crit => [getRange(crit,'start'), getRange(crit,'end')])
										.flatten()
										.compact()
										// have date ranges now
										.map(range => [rangeInfo(range, 'lower'), rangeInfo(range, 'upper')])
										.flatten()
										.compact()
										// have text dates now
										.map(d => new Date(d))
										.value();
		return d3.extent(allDates);
	}
	function obsExtent(primCrits, addCrits) {
		var primDurs = _.chain(primCrits)
										.map(crit => getRange(crit,'dur'))
										.compact()
										// have dur ranges now
										.map(range => rangeInfo(range, 'max'))
										.value();
		var beforeDays = 
					addCrits.map(d=>d.StartWindow.Start.Days * d.StartWindow.Start.Coeff);
		var afterDays = // not quite right because not sure where dur starts
					addCrits.map(d=>d.StartWindow.End.Days * d.StartWindow.End.Coeff +
											 rangeInfo(getRange(d.Criteria,'dur'),'max')||0);
		var beforeDaysWithDurs =
					addCrits.map(d=>d.StartWindow.Start.Days * d.StartWindow.Start.Coeff +
											 rangeInfo(getRange(d.Criteria,'dur'),'max')||0);
		return d3.extent(_.flatten([primDurs, beforeDays, afterDays, beforeDaysWithDurs]));
	}

	ko.bindingHandlers.cohortExpressionCartoon = {
		init: function (element, valueAccessor, allBindingsAccessor) {
			// update when dom element is displayed and has width
			$(element).parents('.tab-pane').bind("DOMSubtreeModified", function() {
				divWidth(element.offsetWidth);
			});
			firstTimeSetup(element);
		},
		update: function (element, valueAccessor, allBindingsAccessor) {
			//console.log('in update');
			if (!divWidth()) {
				return;
			}
			//console.log('staying in update');
			var expression = valueAccessor().expression();
			//console.log(expression);

			if (valueAccessor().tabPath() !== "export/printfriendly") {
				return;
			}
			//console.log('on the right tab');
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
			//console.log('doing stuff in update');
			var cohdef = dataSetup(expression);
			//console.log(cohdef);
			expressionChangeSetup(element, cohdef);
		}
	};


	function drawSection(d3element, cohdef, cat, data, level) {
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
		funcs[cat].header(catDiv.select('div.header'), cohdef, data, level);
		//}
		funcs[cat].body(catDiv.select('div.body'), cohdef, data, level);
	}
	function addCritSectHeader(d3element, cohdef, acsect, level) {
		var text = '<h3>Additional Criteria</h3>'; 
		d3element.html(text);
	}
	function addCritSectBody(d3element, cohdef, acsect, level) {
		drawSection(d3element, cohdef, 'critgroup', acsect, level);
	}
	function inclusionCritHeader(d3element, cohdef, PrimaryCriteria, level) {
	}
	function inclusionCritBody(d3element, cohdef, PrimaryCriteria, level) {
	}
	function addDomainNames(data, cat) { // criteria with domain name attached
		if (cat === 'primary') {
			data.CriteriaList =
						 _.chain(data.CriteriaList)
							.map(_.pairs)
							.flatten()
							.map(d=>{
									var [domain, pc] = d;
									var clone = _.clone(pc);
									clone.domain = domain;
									return clone;
								})
							.value();
		} else {
			data.CriteriaList =
						data.CriteriaList.map(addCrit=>{ // additional criteria
								var domain = _.keys(addCrit.Criteria)[0];
								var clone = _.clone(addCrit);
								var critClone = _.clone(addCrit.Criteria[domain]);
								critClone.domain = domain;
								clone.Criteria = critClone;
								return clone;
							})
		}
	}
	function primaryCritHeader(d3element, cohdef, PrimaryCriteria) {
		var pcList = PrimaryCriteria.CriteriaList;
		var limitType = PrimaryCriteria.PrimaryCriteriaLimit.Type;
		var title = '<h3>Primary Criteria</h3>'; 
		var pcCritMatch;
		var pcPlural = limitType === 'All' ? 's' : '';
		var limitMsg = '';
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
		var resultDateMsg = `Result index date${pcPlural} will be the start date${pcPlural} of the matching event${pcPlural}.`;
		var leftHeader =
			`
			<div class="row">
				Start 
					(<svg style="display:inline-block" height="10px" width="10px">
						<circle cx="5" cy="5" r="4" style="fill:green" />
					</svg>)
				and End 
					(<svg style="display:inline-block" height="10px" width="10px">
						<circle cx="5" cy="5" r="4" style="fill:red" />
					</svg>)
				Dates
			</div>
			<div class="row">
				<svg class="x axis col-xs-12"/>
			</div>`;
		var rightHeader =
			`
			<div class="row">
				Durations
			</div>
			<div class="row">
				<svg class="x axis col-xs-12"/>
			</div>`;
		
		var headerHtml = 
			`
				<div class="row header">
					${title}
					${limitMsg}
					${resultDateMsg}
				</div>
				<div class="row header">
					<div class="col-xs-6 left">
						${leftHeader}
					</div>
					<div class="col-xs-6 right">
						${rightHeader}
					</div>
				</div>
			`;
		d3element.html(headerHtml);
		var w = $(d3element.select('div.left').node()).width();
		cohdef.calScale.range([0,w]);
		cohdef.obsScale.range([0,w]);
		d3element.select('div.left svg.x.axis').call(cohdef.calAxis);
		d3element.select('div.left svg.x.axis').selectAll(".x.axis text")  // select all the text elements for the xaxis
						.attr("transform", function(d) {
							return "translate(" + this.getBBox().height*-2 + "," + 
												this.getBBox().height + ")rotate(-45)";
															        });

		d3element.select('div.right svg.x.axis').call(cohdef.obsAxis);
		d3element.select('div.right svg.x.axis').selectAll(".x.axis text")  // select all the text elements for the xaxis
						.attr("transform", function(d) {
							return "translate(" + this.getBBox().height*-2 + "," + 
												this.getBBox().height + ")rotate(-45)";
															        });
	}
	function primaryCritBody(d3element,cohdef,PrimaryCriteria) {
		critBody(d3element,cohdef,PrimaryCriteria, 'primary');
	}
	function critGroupBody(d3element,cohdef,critgroup, level) {
		critBody(d3element,cohdef,critgroup, 'group');
		critgroup.Groups.forEach( group => {
			drawSection(d3element, cohdef, 'critgroup', group, level + 1);
		});
	}
	function critBody(d3element, cohdef, crit, critType) {
		var crits = crit.CriteriaList;
		var critNodes = d3AddIfNeeded(d3element, crits, 'div', ['crit','row'], critTriad)
		critNodes.selectAll('div.name')
							.call(critName, cohdef, critType);

		critNodes.selectAll('div.left > svg')
							.call(critLeft, cohdef, critType);
		critNodes.selectAll('div.right > svg')
							.call(critRight, cohdef, critType);
	}
	function critTriad(selection) {
		selection.append('div').attr('class', 'name');
		selection.append('div').attr('class', 'left col-xs-6')
			.append('svg').attr('class', 'col-xs-12 cartoon');
		selection.append('div').attr('class', 'right col-xs-6')
			.append('svg').attr('class', 'col-xs-12 cartoon');
	}
	function critName(selection, cohdef, critType) {
		selection.each(function(_crit) {
			var crit = critType === 'group' ? _crit.Criteria : _crit;
			var text = `${critLabel(crit, cohdef)}
									<span style="opacity:0.2">${critCartoonText(crit)}</span>`;
			if (critType === 'group')
				text += `<span style="opacity:0.2">
									${addCritOccurrenceText(_crit)}, ${addCritWindowText(_crit)}
									</span>`;
			d3.select(this).html(text);
		})
	}
	function critRight(selection, cohdef, critType) {
		selection.each(function(_crit) {
			var crit = critType === 'group' ? _crit.Criteria : _crit;
			var el = d3.select(this);
			el.html(''); // clear by brute force, not sure if needed
			var range = getRange(crit, 'dur');
			if (range) {
				if (rangeInfo(range, 'single-double') === 'single') {
					switch (range.Op[0]) {
						case "l": // lt or lte
							el.append('line')
										.attr('y1', 10)
										.attr('y2', 10)
										.attr('x1', cohdef.obsScale(0))
										.attr('x2', cohdef.obsScale(range.Value))
										.attr('stroke-dasharray', '3,3')
										.style(`marker-start`, `url(#line-stop)`)
										.style(`marker-end`, `url(#left-arrow)`)
							break;
						case "g": // gt or gte
							el.append('line')	// solid line to > point
										.attr('y1', 10)
										.attr('y2', 10)
										.attr('x1', cohdef.obsScale(0))
										.attr('x2', cohdef.obsScale(range.Value))
										.style(`marker-start`, `url(#line-stop)`)
										.style(`marker-end`, `url(#line-stop)`)
							el.append('line') // dotted line to the end
										.attr('y1', 10)
										.attr('y2', 10)
										.attr('x1', cohdef.obsScale(range.Value))
										.attr('x2', cohdef.obsScale.range()[1])
										.attr('stroke-dasharray', '3,3')
										.style(`marker-start`, `url(#line-stop)`)
										.style(`marker-end`, `url(#right-arrow)`)
							break;
						case "e": // eq
							el.append('line')
										.attr('y1', 10)
										.attr('y2', 10)
										.attr('x1', cohdef.obsScale(0))
										.attr('x2', cohdef.obsScale(range.Value))
										.style(`marker-start`, `url(#line-stop)`)
										.style(`marker-end`, `url(#line-stop)`)
					}
				} else {
					console.log("NOT HANDLING BETWEEN YET");
				}
			}
		})
	}
	function critLeft(selection, cohdef, critType) {
		selection.each(function(_crit) {
			var crit = critType === 'group' ? _crit.Criteria : _crit;
			var el = d3.select(this);
			el.html(''); // clear by brute force, not sure if needed
			drawCalThing('start');
			drawCalThing('end');
			function drawCalThing(which) {
				var range = getRange(crit, which);
				if (range) {
					var date = new Date(range.Value);
					el.append('circle')
							//.style('fill', which === 'start' ? 'green' : 'red')
							.attr('class', `term-${which}`)
							.attr('cx', cohdef.calScale(date))
							.attr('cy', 10)
							.attr('r', 7)
					el.append('line')
								.attr('y1', 10)
								.attr('y2', 10)
								.attr('x1', cohdef.calScale(date) + 38 * (range.Op[0]==='l' ? -1 : 1))
								.attr('x2', cohdef.calScale(date) +  8 * (range.Op[0]==='l' ? -1 : 1))
								.attr('stroke-dasharray', '3,3')
								.style(`marker-start`, 
											 `url(#left-arrow)`)
					/*
					el.append("text")
								.attr('y', 10)
								.attr('x', cohdef.calScale(date))
								.attr("font-family","FontAwesome")
								.attr('text-anchor', 'middle')
								.attr('alignment-baseline', 'middle')
								.text(which === 'end' ? '\uf0a5' : '\uf0a4') // hand-o-left/right
								.style('fill', which === 'start' ? 'green' : 'red')
					*/
				}
			}
		})
	}
	function symbol(opts) {
		var sp = {}; // symbol params
		switch (opts.term) {
			case 'start':
				sp.color = 'green'; break;
			case 'end':
				sp.color = 'red'; break;
			default:
				sp.color = 'steelblue';
		}
	}
	function critGroupHeader(d3element, cohdef, cg, level) {
		var all_any = `Restrict to people matching ${cg.Type.toLowerCase()} of the
										following criteria`;
		var leftHeader =
			`
			<div class="row">
				Calendar Start 
					(<svg style="display:inline-block" height="10px" width="10px">
						<circle cx="5" cy="5" r="4" style="opacity:.4; fill:green" />
					</svg>)
				/ End 
					(<svg style="display:inline-block" height="10px" width="10px">
						<circle cx="5" cy="5" r="4" style="opacity:.4; fill:red" />
					</svg>)
				for additional criteria
			</div>
			<div class="row">
				<svg class="x axis col-xs-12"/>
			</div>`;
		var rightHeader =
			`
			<div class="row">
				Additional criteria start date 
					(<svg style="display:inline-block" height="10px" width="10px">
						<circle cx="5" cy="5" r="4" style="opacity:.4; fill:green" />
					</svg>)
				and duration 
					(<svg style="display:inline-block" height="10px" width="38px">
						<line x1="2" x2="27" y1="5" y2="5" 
							style="marker-start:url(#line-stop); marker-end:url(#right-arrow)" />
					</svg>)
				relative to index date
					(Day 0, <svg style="display:inline-block" height="10px" width="10px">
						<circle cx="5" cy="5" r="4" style="fill:green" />
					</svg>)
			</div>
			<div class="row">
				<svg class="x axis col-xs-12"/>
			</div>`;
		
		var headerHtml = 
			`
				<div class="row header">
					${all_any}
				</div>
				<div class="row header">
					<div class="col-xs-6 left">
						${leftHeader}
					</div>
					<div class="col-xs-6 right">
						${rightHeader}
					</div>
				</div>
			`;
		d3element.html(headerHtml);
		var w = $(d3element.select('div.left').node()).width();
		cohdef.calScale.range([0,w]);
		cohdef.obsScale.range([0,w]);
		d3element.select('div.left svg.x.axis').call(cohdef.calAxis);
		d3element.select('div.left svg.x.axis').selectAll(".x.axis text")  // select all the text elements for the xaxis
						.attr("transform", function(d) {
							return "translate(" + this.getBBox().height*-2 + "," + 
												this.getBBox().height + ")rotate(-45)";
															        });

		d3element.select('div.right svg.x.axis').call(cohdef.obsAxis);
		d3element.select('div.right svg.x.axis').selectAll(".x.axis text")  // select all the text elements for the xaxis
						.attr("transform", function(d) {
							return "translate(" + this.getBBox().height*-2 + "," + 
												this.getBBox().height + ")rotate(-45)";
															        });
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
	function obsperiodHeader(d3element, cohdef) {
		var prior = Math.abs(cohdef.PrimaryCriteria.ObservationWindow.PriorDays);
		var post = cohdef.PrimaryCriteria.ObservationWindow.PostDays;

		var text = "<h3>Observation Period</h3>";

		if (!(prior || post)) {
			d3element.html(text + "No required observation period");
			return;
		}
		text += `Required observation period from at least ${prior} days
								before to at least ${post} days after index date. `;

		var extra = [];
		var obswin = obsWindow(cohdef);
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
	function obsperiodBody(d3element, cohdef) {
		var obswin = obsWindow(cohdef);
		var prior = Math.abs(cohdef.PrimaryCriteria.ObservationWindow.PriorDays);
		var post = cohdef.PrimaryCriteria.ObservationWindow.PostDays;
		if (!(prior || post)) {
			return;
		}
		var html = `
				<div class="row header">
					<div class="col-xs-6 left">
					</div>
					<div class="col-xs-6 right">
						<svg/>
					</div>
				</div>`;
		d3element.html(html);
		var svg = d3element.select('svg');

		svg.append('path').attr('class','curly-brace')
											.classed('first', true);
		svg.append('path').attr('class','curly-brace')
											.classed('second', true);

		svg = d3element.select("svg");
		svg.attr('width', divWidth())
				.attr('height', lineHeight * 3)

		svg.select('path.curly-brace.first').attr('d', makeCurlyBrace(
																cohdef.obsScale(-prior),
																.5 * lineHeight,
																cohdef.obsScale(post),
																.5 * lineHeight,
																lineHeight * 2,
																0.6,
																cohdef.obsScale(0) /*+ lineHeight/2*/)); 
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
																	cohdef.obsScale(obswin.min),
																	.5 * lineHeight,
																	cohdef.obsScale(obswin.max),
																	.5 * lineHeight,
																	lineHeight * 2,
																	0.6,
																	cohdef.obsScale(0) /*+ lineHeight/2*/)) 
				.attr('stroke-dasharray', '3,3')
		}
	}


























	window.d3 = d3;
	var width = 400;
	var height = 450;

	//var expression = {};
	//var conceptSets = [];
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

	function obsWindow(cohdef) {
		var criteriaGroup = cohdef.AdditionalCriteria;
		var domain = {
			min: -cohdef.PrimaryCriteria.ObservationWindow.PriorDays, 
			max: cohdef.PrimaryCriteria.ObservationWindow.PostDays
		};
		var primaryWindow = { min: domain.min, max: domain.max };
		var getEndPoints = function(cg) {
			var s = cg.StartWindow.Start.Days *
							cg.StartWindow.Start.Coeff;
			var e = cg.StartWindow.End.Days *
							cg.StartWindow.End.Coeff;
			domain.min = Math.min(domain.min, s);
			domain.max = Math.max(domain.max, e);
		};
		criteriaGroupWalk(criteriaGroup, getEndPoints); // broken
		return domain;
	}
	function criteriaGroupWalk(criteriaGroup, cb, parentKey) {
		var list = criteriaGroup ? criteriaGroup.CriteriaList : [];
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
		var groups = criteriaGroup ? criteriaGroup.Groups : [];
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
				return Math.max(range.Value, range.Extent);
				// need this? if (range.Op === "!bt") return; // no upper limit
			case "upper":
				//console.log(range.Extent(), range.Op(), range.Value());
				return typeof range.Extent === "undefined" ? range.Value : range.Extent; 
							// Extent is high end for "bt"
			case "min": // not used
				if (range.Op === "!bt")
					return; // no lower limit
			case "lower":
			case "val":
				return range.Value;
			case "single-double":
				if (range.Op.match(/bt/))
					return 'double';
				return 'single';
			case "nice-op":
				switch (range.Op) {
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
					return crit.EraLength;
				}
				switch (crit.domain) {
					case "DrugExposure":
						return crit.DaysSupply;
					case "ObservationPeriod":
						return crit.PeriodLength;
					case "VisitOccurrence":
						return crit.VisitLength;
				}
				return;
			case "start":
				whichEnd = 'StartDate';
				break;
			case "end":
				whichEnd = 'EndDate';
				break;
		}
		if ('EraLength' in crit)
			return crit['Era' + whichEnd];
		if (crit.domain === 'ObservationPeriod')
			return crit['Period' + whichEnd];
		if (crit['Occurrence' + whichEnd])
			return crit['Occurrence' + whichEnd];
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
	function conceptName(crit, cohdef) {
		return crit.CodesetId > -1 ? 
						cohdef.ConceptSets[crit.CodesetId].name : '';
	}
	function critLabel(crit, cohdef) {
		var dom = niceDomain(crit.domain);
		var name = conceptName(crit, cohdef);
		if (name)
			return `${dom}: ${name}`;
		return `any ${dom}`;
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
				.attr('fill-opacity', 0)
				.attr('stroke','steelblue')
				.attr('orient', 'auto')
				.append('path')
					.attr('d', 'M 2 2 L 8 5 L 2 8 z')
		svg.append('marker')
				.attr('id', 'left-arrow')
				.attr('viewBox', '0 0 10 10')
				.attr('refX', 10)
				.attr('refY', 5)
				.attr('markerUnits', 'strokeWidth')
				.attr('markerWidth', 10)
				.attr('markerHeight', 10)
				.attr('stroke','steelblue')
				.attr('fill-opacity', 0)
				.attr('orient', 'auto')
				.append('path')
					.attr('d', 'M 8 2 L 8 8 L 1 5 z')
		svg.append('marker')
				.attr('id', 'line-stop')
				.attr('viewBox', '0 0 2 10')
				.attr('refX', 0)
				.attr('refY', 5)
				.attr('markerUnits', 'strokeWidth')
				.attr('markerWidth', 2)
				.attr('markerHeight', 10)
				.attr('stroke','steelblue')
				.attr('fill-opacity', 0)
				.attr('orient', 'auto')
				.append('path')
					.attr('d', 'M 0 0 L 1 0 L 1 10 L 0 10 z')
	}
	function addCritOccurrenceText(ac) {
		var oc = ac.Occurrence;
		return `with ${['exactly','at most','at least'][oc.Type]}
							${oc.Count} using ${oc.IsDistinct ? 'distinct' : 'all'} occurrences`;
	}
	function addCritWindowText(ac) {
		var sw = ac.StartWindow;
		return `occurring between 
							${sw.Start.Days} days ${sw.Start.Coeff===-1 ? 'before' : 'after'} and
							${sw.End.Days} days ${sw.End.Coeff===-1 ? 'before' : 'after'} index`;
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
});
