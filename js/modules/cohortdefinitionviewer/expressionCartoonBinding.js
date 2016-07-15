"use strict";
define(['knockout','d3', 'lodash'], function (ko, d3, _) {

	var divWidth = ko.observable(); // triggers update
	const INDENT_COLS = 2; // for the whole leftmost column
	function indentCols(depth) { // for the indent-bar width
		return Math.floor(12 / (cohdef.maxDepth + 1)) * (depth + 1);
	}
	const NAME_COLS = 2;
	const SVG_LINE_HEIGHT = 15;
	const arrows = {
		right: 'm -5 -5 l 10 5 l -10 5 z',
		//right: 'M 2 2 L 8 5 L 2 8 z',
		left: 'M 8 2 L 8 8 L 1 5 z',
		stop: 'M 0 0 L 1 0 L 1 10 L 0 10 z',
	};
	function ypos({
									brace = true,
									dot = true,
									dur = false,
									dates = false
								} = {}, feature) { // need to change for additional crits
		var topMargin = .25;
		var bottomMargin = .25;
		var braceLabel = brace ? 1 : 0;
		var brace = brace ? 1.5 : 0; // first 1 lines (if it it present)
		var dot = dot ? .5 : 0;		 // next line (if it it present)
		var dur = dur ? 0 : 0;		 // put with dot	
		var dates = dates ? 1 : 0; // next line (if it it present)

		var lines = topMargin + braceLabel + brace + dot + dur + dates + bottomMargin;

		switch (feature) {
			case "svg-height":
				return lines * SVG_LINE_HEIGHT;
			case "brace-label":
				return (topMargin + braceLabel - .2) * SVG_LINE_HEIGHT; // 10% margin
			case "brace-top":
				return (topMargin + braceLabel) * SVG_LINE_HEIGHT; // 10% margin
			case "brace-height":
				return brace * SVG_LINE_HEIGHT; // 10% top and bottom
			case "index-dot":
				return (topMargin + brace + braceLabel + dot * .5) * SVG_LINE_HEIGHT;
			case "index-r":
				return dot * .5 * SVG_LINE_HEIGHT;
			case "dates":
				return (topMargin + brace + braceLabel + dot + dur + dates * .5) * SVG_LINE_HEIGHT;
		}
	}

	function firstTimeSetup(element) {
		//expressionChangeSetup(element, cohdef);
		//setupArrowHeads(element);
	}
	function expressionChangeSetup(element, cohdef) {
		var d3element = d3.select(element);
		drawSection(d3element, cohdef, 'primary-section', cohdef.PrimaryCriteria);
		//drawSection(d3element, cohdef, 'obsperiod-section', cohdef);
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
		cohdef.maxDepth = _.max(allGroups(cohdef).map(d=>d.level));

		var obsext = obsExtent(cohdef.PrimaryCriteria.CriteriaList,
												allAdditionalCriteria(cohdef), cohdef);
		cohdef.obsExt = obsext;
		cohdef.obsScale = d3.scale.linear();
		cohdef.obsAxis = d3.svg.axis().orient('bottom').scale(cohdef.obsScale);
		return cohdef;
		/*
		if (obsext && !(obsext[0] === 0 && obsext[1] === 0)) {
			cohdef.columns.push('obs');
		}
		*/
	}
	function resetScales(cohdef, width) {
		var extraPx = 25; // room at ends of cartoons for arrows past domain dates
		var extraRatio = extraPx / width; // add to ends of domains

		var obsext = obsExtent(cohdef.PrimaryCriteria.CriteriaList,
												allAdditionalCriteria(cohdef), cohdef);
		if (obsext && !(obsext[0] === 0 && obsext[1] === 0)) {
			var extraDays = extraRatio * (Math.abs(obsext[0]) + Math.abs(obsext[0]));
			cohdef.obsScale.range([0,width])
										.domain([obsext[0] - extraDays, obsext[1] + extraDays])
		}
		console.log(obsext, cohdef.obsScale.domain(), extraRatio, extraDays);
		cohdef.obsExt = obsext;
		//console.log(cohdef.obsScale.domain());
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
	function subGroups(group, level=0) { // returns array of this group and its subgroups
		if (!group) return [];
		group.level = level;
		if (group.Groups.length)
			return _.flatten([group].concat(group.Groups.map(g=>subGroups(g,level+1))));
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
		if (!allDates.length) return;
		return d3.extent(allDates);
	}
	function swinMax(swinterm, ext) {
		// for null (All), get max
		if (swinterm.Days === null && ext) {
			var max = ext[ swinterm.Coeff === -1 ? 0 : 1 ];
			return Math.abs(max) * swinterm.Coeff;
		}
		return swinterm.Days * swinterm.Coeff;
	}
	function swinMaxWDur(crit, term, ext) {
			var dur = rangeInfo(getRange(crit.Criteria,'dur'),'max');
			if (dur)
				return dur + swinMax(crit.StartWindow[term], ext);
	}
	function obsExtent(primCrits, addCrits, cohdef) {
		var primDurs = _.chain(primCrits)
										.map(crit => getRange(crit,'dur'))
										.compact()
										// have dur ranges now
										.map(range => rangeInfo(range, 'max'))
										.value();
		var beforeDays = addCrits.map(d=>swinMax(d.StartWindow.Start, cohdef));
		var afterDays = addCrits.map(d=>swinMax(d.StartWindow.End, cohdef));
		var obsDays = [-cohdef.PrimaryCriteria.ObservationWindow.PriorDays, 
										cohdef.PrimaryCriteria.ObservationWindow.PostDays];
		var allDayOffsets = _.flatten([primDurs, beforeDays, afterDays, obsDays])
		if (!allDayOffsets.length) return;

		var ext = d3.extent(allDayOffsets);
		var beforeDaysWithDurs = addCrits.map(d=>swinMaxWDur(d, 'Start', ext));
		var afterDaysWithDurs = addCrits.map(d=>swinMaxWDur(d, 'End', ext));

		allDayOffsets = _.flatten([allDayOffsets, beforeDaysWithDurs, afterDaysWithDurs]);
		return d3.extent(allDayOffsets);
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


	function drawSection(d3element, cohdef, cat, data, level, opts) {
		//if (Array.isArray(data)) throw new Error("didn't expect array", data);
		var funcs = {
			'primary-section':		{ header: primaryCritHeader,		body: primaryCritBody },
			'additional-section': { header: addCritSectHeader,		body: critGroupBody },
			'critgroup':					{ header: critGroupHeader,			body: critGroupBody },
			'inclusion-section':	{ header: inclusionRulesHeader,	body: inclusionRulesBody },
			'inclusion-rule':			{ header: inclusionRuleHeader,	body: inclusionRuleBody },
			//'obsperiod-section':	{ header: obsperiodHeader,			body: obsperiodBody },
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
		funcs[cat].header(catDiv.select('div.header'), cohdef, data, level, opts);
		//}
		if (data)
			funcs[cat].body(catDiv.select('div.body'), cohdef, data, level, opts);
	}
	function addCritSectHeader(d3element, cohdef, acsect, level) {
		var text = '<h3>Additional Criteria</h3>'; 
		if (!acsect)
			text = 'No additional criteria';
		d3element.html(text);
	}
	/*
	function addCritSectBody(d3element, cohdef, acsect, level) {
		drawSection(d3element, cohdef, 'critgroup', acsect, level);
	}
	*/
	function inclusionRulesHeader(d3element, cohdef, rules, level) {
		var text = '<h3>Inclusion Rules</h3>'; 
		if (!rules)
			text = 'No inclusion rules';
		d3element.html(text);
	}
	function inclusionRulesBody(d3element, cohdef, rules, level) {
		rules.forEach(function(rule) {
			var rulediv = d3element.append('div');
			drawSection(rulediv, cohdef, 'inclusion-rule', rule, 0);
		});
	}
	function inclusionRuleHeader(d3element, cohdef, rule, level) {
		var text = `<h4>${rule.name}</h4>${rule.description}`; 
		d3element.html(text);
	}
	function inclusionRuleBody(d3element, cohdef, rule, level) {
		drawSection(d3element, cohdef, 'critgroup', rule.expression, 0);
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
		var resultDateMsg = `Result index date${pcPlural} will be the start date${pcPlural} of the 
													matching event${pcPlural}.`;
		var calHeader = `
					Start 
						(<svg style="display:inline-block" height="10px" width="10px">
							<circle cx="5" cy="5" r="4" style="fill:green" />
						</svg>)
					and End 
						(<svg style="display:inline-block" height="10px" width="10px">
							<circle cx="5" cy="5" r="4" style="fill:red" />
						</svg>)
					Dates`;
		var rightHeader = `
				Durations
				<svg class="x axis col-xs-12"/>`;
		
		var pickadiv = ''; // doesn't matter, as long as it exists. they should all 
											 // be the same width
		var headerHtml = `
				<div class="row header">
					<div class="col-xs-12">
						${title}
						${limitMsg}
						${resultDateMsg}
						<div class="row">
							<div class="right col-xs-${12-(INDENT_COLS+NAME_COLS)} col-xs-offset-${(INDENT_COLS+NAME_COLS)}">
								${calHeader}
								${rightHeader}
							</div>
						</div>
					</div>`;
		d3element.html(headerHtml);
		var w = $(d3element.select(`div.right`).node()).width();
		resetScales(cohdef, w);
		d3element.select('svg.x.axis').call(cohdef.obsAxis);
		d3element.select('svg.x.axis').selectAll(".x.axis text") // select all the text elements for the xaxis
						.attr("transform", function(d) {
							return "translate(" + this.getBBox().height*-2 + "," + 
																		this.getBBox().height + ")rotate(-45)";
						});
	}
	function header() {
	}
	function critTriad(selection, cohdef) { // not a triad anymore
		// the reason this uses d3 append rather than composing html is to
		// send __data__ down to all the elements
		selection.append('div').attr('class', `indenting col-xs-${INDENT_COLS}`)
			.append('div').attr('class', 'row')
			.each(function() {
				d3.select(this).append('div').attr('class', 'col-xs-6')
											 .append('div').attr('class', 'row')
											 .append('div').attr('class', 'indent-bar')
				d3.select(this).append('div').attr('class', 'indent-text col-xs-6');
			})
		selection.append('div').attr('class', `name col-xs-${NAME_COLS}`)
		selection.append('div').attr('class', `right col-xs-${12-(INDENT_COLS+NAME_COLS)}`)
			.append('div').attr('class', 'row')
			.append('svg').attr('class', 'col-xs-12 cartoon');
	}
	function primaryCritBody(d3element,cohdef,PrimaryCriteria) {
		PrimaryCriteria.CriteriaList.forEach((crit,i) => {
			crit.critIndex = i;
		});
		critBody(d3element,cohdef,PrimaryCriteria, 'primary', 
							{depth:0});
	}
	function critGroupBody(d3element,cohdef,critgroup, level) {
		/*
		if (level === 0) {
			var subs = subGroups(critgroup);
			var maxDepth = _.max(subs.map(d=>d.level));
		}
		*/
		var critIndex = -1;
		critgroup.CriteriaList.forEach((crit,i) => {
			crit.critIndex = ++critIndex;
		});
		critBody(d3element,cohdef,critgroup, 'group', 
						 {depth:level});
		critgroup.Groups.forEach( group => {
			drawSection(d3element, cohdef, 'critgroup', group, level + 1, 
									{depth:level, critIndex});
		});
	}
	function critBody(d3element, cohdef, crit, critType, opts) {
		var crits = crit.CriteriaList;
		var critNodes = d3AddIfNeeded(d3element, crits, 'div', ['crit','row'], 
																	critTriad, cohdef)

		critNodes.selectAll('div.indent-bar')
							.attr('class', `indent-bar col-xs-${indentCols(opts.depth)}`)
							.style('background-color', 'brown')
							.style('height', function(crit) {
								var durRange = getRange(crit, 'dur');
								var startDateRange = getRange(crit, 'start');
								var endDateRange = getRange(crit, 'end'); // ignore these?
								return ypos({dates:startDateRange||endDateRange,
														 durRange, brace: true}, 'svg-height') + 'px';
							})

		critNodes.selectAll('div.indent-text')
							.html(function(crit) {
								return `${opts.depth}/${cohdef.maxDepth}:${crit.critIndex}`;
							});

		critNodes.selectAll('div.name')
							.style('height', function(crit) {
								var durRange = getRange(crit, 'dur');
								var startDateRange = getRange(crit, 'start');
								var endDateRange = getRange(crit, 'end'); // ignore these?
								return ypos({dates:startDateRange||endDateRange,
														 durRange, brace: true}, 'svg-height') + 'px';
							})
							.call(critName, cohdef, critType);

		critNodes.selectAll('div.right > div.row > svg')
							.call(drawCrits, cohdef, critType);
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
	function symbol(opts, cohdef) {
		var tag = 'circle';
		var classes = [
					`term-${opts.term}`,
					`crit-${opts.crit}`,
					opts.inclusive ? 'inclusive' : 'exclusive',
		];
		var x = cohdef.obsScale;
		return `
						<${tag} 
							class="${classes.join(' ')}" 
							cx="${x(opts.x)}" 
							cy="${opts.y}"
							r="${opts.r}"
						/>`;
	}
	function interval(sym1, sym2, opts, cohdef) {
		var x = cohdef.obsScale;
		var terms = [];
		var y = opts.y || 15; // FIX, shouldn't need this
		var line = `<line 
											x1="${x(opts.x1)}"
											x2="${x(opts.x2)}"
											y1="${opts.y||15}" y2="${opts.y||15}"
											style="${terms.join(' ')}"
											class="${opts.fixed ? 'fixed' : 'conditional'} 
														 ${opts.term ? ('term-'+opts.term) : ''}" />`;
		if (opts.markerStart) {
			line += `<path d="M ${x(opts.x1)} ${y} ${arrows[opts.markerStart]}" class="term-start" />`;
		}
		if (opts.markerEnd) {
			line += `<path d="M ${x(opts.x2)} ${y} ${arrows[opts.markerEnd]}" class="term-end" />`;
		}
		return `
						${sym1}
						${sym2}
						${line}`;
	}
	function durInterval(range, crit, cohdef) {
		var html = '';
		if (rangeInfo(range, 'single-double') === 'single') {
			var y = ypos({dur: range, brace: true}, 'index-dot');
			switch (range.Op[0]) {
				case "g": // gt or gte
					html += interval('','', {fixed:true, x1:0, x2:range.Value, y,
																	 markerEnd:'right',
																	 term:'end' // duration is how long before it ends
																	}, cohdef);
					html += interval('','', {fixed:false, x1:range.Value, x2:cohdef.obsExt[1], y,
																	 markerEnd:'right',
																	 term:'end' // duration is how long before it ends
																	}, cohdef);
					html += `
										<text x="${cohdef.obsScale(range.Value) + 3}"
													y="${y - 4}"
										>${durationType(crit)} ${rangeInfo(range,'nice-op')} 
											${range.Value} days</text>
					`;
					return html;
					break;
				case "l": // lt or lte
					//html += interval('','', )
					return '<text y="20">not handling duration less than yet</text>';
					el.append('line')
								.attr('y1', 10)
								.attr('y2', 10)
								.attr('x1', cohdef.obsScale(0))
								.attr('x2', cohdef.obsScale(range.Value))
								.attr('stroke-dasharray', '3,3')
								.style(`marker-start`, `url(#line-stop)`)
								.style(`marker-end`, `url(#left-arrow)`)
					break;
				case "e": // eq
					return '<text y="20">not handling duration equal to yet</text>';
					el.append('line')
								.attr('y1', 10)
								.attr('y2', 10)
								.attr('x1', cohdef.obsScale(0))
								.attr('x2', cohdef.obsScale(range.Value))
								.style(`marker-start`, `url(#line-stop)`)
								.style(`marker-end`, `url(#line-stop)`)
				default: // eq
					return `<text y="20">not handling duration ${range.Op} yet</text>`;
			}
		} else {
			return `<text y="20">not handling duration ${rangeInfo(range,'nice-op')} yet</text>`;
		}
	}
	function dateSymbols(crit, durRange, startDateRange, endDateRange, cohdef) {
		var html = '';
		if (endDateRange) {
			html += `<text y="40">not handling end dates</text>`;
		}
		if (startDateRange) {
			var y = ypos({dates:startDateRange||endDateRange,
											durRange, brace: true}, 'dates');
			var r = ypos({dates:startDateRange||endDateRange,
											durRange, brace: true}, 'index-r');
			var xIndex = 0;
			//var xEdge = cohdef.obsExt[0];
			var circle = symbol({term:'start', crit:'primary', 
														inclusive:startDateRange.Op.match(/e/), 
														x:xIndex, y, r}, cohdef);
			var whichSide;
			var anchor;
			switch (startDateRange.Op[0]) {
				case "l":
					whichSide = 1;
					anchor = 'start';
					break;
				case "g":
				case "e":
					whichSide = -1;
					anchor = 'end';
					break;
			}
			var text = `
									<text x="${cohdef.obsScale(xIndex) + 11 * whichSide}"
												y="${y + 4}"
												alignment-baseline="top"
												text-anchor="${anchor}"
									>start ${rangeInfo(startDateRange,'nice-op')}
									 ${startDateRange.Value}
									</text>`;
			return circle + text;
			//return interval( '', {fixed:false, x1:xIndex, x2:xEdge, y}, cohdef);
		}
		return html;
	}
	function drawCrits(selection, cohdef, critType) {
		selection.each(function(_crit) {
			var el = d3.select(this); // the svg
			var crit = _crit;
			var html = '';
			var durRange = getRange(crit, 'dur');
			var startDateRange = getRange(crit, 'start');
			var endDateRange = getRange(crit, 'end'); // ignore these?
			el.attr('height', ypos({dates:startDateRange||endDateRange,
															durRange, brace: true}, 'svg-height'));
			if (critType === 'primary') {
				if (durRange) {
					html += durInterval(durRange, crit, cohdef);
				}
				html += obsPeriodBrace(crit, durRange, startDateRange, endDateRange, cohdef);
				html += dateSymbols(crit, durRange, startDateRange, endDateRange, cohdef)
				el.html(html);
				return;
			}
			if (critType === 'group') {
				crit = _crit.Criteria;
				var sw = _crit.StartWindow;
				var swin = [sw.Start.Coeff * sw.Start.Days, sw.End.Coeff * sw.End.Days];
				var fixedWindow = true;
				if (sw.Start.Days === null) {
					swin[0] = null;
					fixedWindow = false;
				}
				if (sw.End.Days === null) {
					swin[1] = null;
					fixedWindow = false;
				}
				if (fixedWindow) {
					html += 
						interval(
							symbol({term:'start', crit:'window', inclusive:'true', x:swin[0], y:15, r:4}, cohdef),
							symbol({term:'end', crit:'window', inclusive:'true', x:swin[1], y:15, r:4}, cohdef),
							{fixed:true, x1:swin[0], x2:swin[1]}, cohdef);
				} else {
					if (swin[0] === null && swin[1] === null) {
						// do something
					} else if (swin[0] === null) {
						html += 
							interval(
								'',
								symbol({term:'end', crit:'window', inclusive:'true', x:swin[1], y:15, r:4}, cohdef),
								{fixed:false, x1:cohdef.obsExt[0], x2:swin[1],
									markerStart:'left'}, cohdef);
					} else if (swin[1] === null) {
						html += 
							interval(
								symbol({term:'start', crit:'window', inclusive:'true', x:swin[0], y:15, r:4}, cohdef),
								'',
								{fixed:false, x1:swin[0], x2:cohdef.obsExt[1],
									markerEnd:'right'}, cohdef);
					}
				}
				el.html(html);
				return;
			}
		})
	}
	function obsPeriodBrace(crit, durRange, startDateRange, endDateRange, cohdef) {
		var prior = Math.abs(cohdef.PrimaryCriteria.ObservationWindow.PriorDays);
		var post = cohdef.PrimaryCriteria.ObservationWindow.PostDays;
		if (!(prior || post)) {
			return '';
		}
		var dotY = ypos({dates:startDateRange||endDateRange,
										 durRange, brace: true}, 'index-dot');
		var dotR = ypos({dates:startDateRange||endDateRange,
										 durRange, brace: true}, 'index-r');
		var braceTop = ypos({dates:startDateRange||endDateRange,
																			durRange, brace: true}, 'brace-top');
		var braceLabel = ypos({dates:startDateRange||endDateRange,
																			durRange, brace: true}, 'brace-label');
		var braceHeight = ypos({dates:startDateRange||endDateRange,
																			durRange, brace: true}, 'brace-height');
		var braceLeft = cohdef.obsScale(-prior);
		var braceRight = cohdef.obsScale(post);
		var braceMid = (braceLeft + braceRight) / 2;

		var indexDateDot = symbol({term:'start', crit:'primary', 
															 inclusive:'true', x:0, y:dotY, r:dotR}, cohdef);
		var html = `
				${indexDateDot}
				<text x="${braceLeft}"
							y="${braceLabel}"
							text-anchor="middle">-${prior}</text>
				<text x="${braceRight}"
							y="${braceLabel}"
							text-anchor="middle">${post}</text>
				<text x="${braceMid}"
							y="${braceLabel}"
							text-anchor="middle">obs</text>
				<path class="curly-brace" 
							d="${ makeCurlyBrace(
																braceLeft,
																braceTop,
																braceRight,
																braceTop,
																braceHeight,
																0.6,
																cohdef.obsScale(0))}" />
		`;
		return html;
	}
	function critGroupHeader(d3element, cohdef, cg, level) {
		if (!cg) {
			d3element.html('No criteria group');
			return;
		}
		var all_any = `Restrict to people matching ${cg.Type.toLowerCase()} of the
										following criteria`;
		var rightHeader = `
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
				<svg class="x axis col-xs-12"/>`;
		
		var headerHtml = `
				<div class="row header">
					<div class="col-xs-12">
						<div class="row">
							<div class="indenting col-xs-${INDENT_COLS}"></div>
							<div class="name col-xs-${NAME_COLS}"></div>
							<div class="right col-xs-${12-(INDENT_COLS+NAME_COLS)}">
								${all_any}
								${rightHeader}
							</div>
						</div>
					</div>
				</div>`;
		d3element.html(headerHtml);
		d3element.select('svg.x.axis').call(cohdef.obsAxis);
		d3element.select('svg.x.axis').selectAll(".x.axis text") // select all the text elements for the xaxis
						.attr("transform", function(d) {
							return "translate(" + this.getBBox().height*-2 + "," + 
																		this.getBBox().height + ")rotate(-45)";
						});
	}
	function d3AddIfNeeded(parentElement, data, tag, classes, 
													firstTimeCb, cbParams) {
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
				.call(firstTimeCb, cbParams);
		selection = d3element.selectAll([tag].concat(classes).join('.'));
		return selection;
	}
	/*
	function obsperiodHeader(d3element, cohdef) {
		var prior = Math.abs(cohdef.PrimaryCriteria.ObservationWindow.PriorDays);
		var post = cohdef.PrimaryCriteria.ObservationWindow.PostDays;

		var text = "<h3>Observation Period</h3>";

		if (!(prior || post)) {
			d3element.html("No required observation period");
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
				.attr('height', 60)

		svg.select('path.curly-brace.first').attr('d', makeCurlyBrace(
																cohdef.obsScale(-prior),
																15,
																cohdef.obsScale(post),
																15, 60,
																0.6,
																cohdef.obsScale(0))); 
		var extra = [];
		if (Math.abs(obswin.min) > Math.abs(prior)) {
			extra.push(Math.abs(obswin.min) + ' days before');
		}
		if (obswin.max > post) {
			extra.push(obswin.max + ' days after');
		}
		if (extra.length) {
			svg.select('path.curly-brace.second')
				.attr('d', makeCurlyBrace(
																	cohdef.obsScale(obswin.min),
																	15,
																	cohdef.obsScale(obswin.max),
																	15, 60,
																	0.6,
																	cohdef.obsScale(0) )) 
				.attr('stroke-dasharray', '3,3')
		}
	}
	*/


























	window.d3 = d3;
	var width = 400;
	var height = 450;

	var textLinesBeforeBrace = 1;
	var braceLines = 2;
	var textLinesAfterBrace = 2;

	function obsWindow(cohdef) {
		var ext = obsExtent(cohdef.PrimaryCriteria.CriteriaList,
												allAdditionalCriteria(cohdef), cohdef);
		return { min: ext[0], max: ext[1] };
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
			return "Era";
		}
		switch (crit.domain) {
			case "DrugExposure":
				return "Days supply";
			case "ObservationPeriod":
			case "VisitOccurrence":
				return "Visit";
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
