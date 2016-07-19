"use strict";
define(['knockout','d3', 'lodash'], function (ko, d3, _) {

	var divWidth = ko.observable(); // triggers update
	var cartoonWidth = ko.computed(function() {
												return divWidth() * 0.6;
											});
	const INDENT_COLS = 1; // for the whole leftmost column
	function indentColsOBSOLETE(depth) { // for the indent-bar width
		return Math.floor(12 / (cohdef.maxDepth + 1)) * (depth + 1);
	}
	const NAME_COLS = 2;
	const SVG_LINE_HEIGHT = 17;
	const arrows = {
		right: 'm -5 -5 l 10 5 l -10 5 z',
		//right: 'M 2 2 L 8 5 L 2 8 z',
		left: 'M 8 2 L 8 8 L 1 5 z',
		stop: 'M 0 0 L 1 0 L 1 10 L 0 10 z',
	};
	function ypos(crit, feature, critType='primary',element) {
		var durRange = getRange(crit, 'dur');
		var startDateRange = getRange(crit, 'start');
		//var endDateRange = getRange(crit, 'end'); // ignore these?

		// sections
		// getting rid of top brace
		// var brace = true, dot = true, dur = !!durRange, dates = !!startDateRange;
		var brace = false, dot = true, dur = false, dates = !!startDateRange;

		// additional sections  (critType is group, which should maybe change)
		var addBrace = (critType!=='primary'),
				addDot = (critType!=='primary');

		var topMargin = .25;
		var bottomMargin = .25;
		var braceLabel = brace ? 1 : 0;		// first line if brace present
		brace = brace ? 1.5 : 0;					// next 1.5 lines if brace present
		dot = dot ? .5 : 0;
		dur = dur ? 0 : 0;								// put with dot	
		dates = dates ? 1 : 0;

		var addBraceLabel = addBrace ? 1 : 0;
		addBrace = addBrace ? 1.5 : 0;
		addDot = addDot ? .5 : 0;

		var lines = topMargin 
								+ braceLabel + brace + dot + dur + dates 
								+ addBraceLabel + addBrace + addDot
								+ bottomMargin;
		var addStart = topMargin + braceLabel + brace + dot + dur + dates;

		switch (feature) {
			case "svg-height":
				return Math.max(
								Math.max(1, lines) * SVG_LINE_HEIGHT,
								(element ? $(element).height() : 0));
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
			case "sec-header-height":
				return 35;
			case "header-height":
				return 30;

			case "add-dot":
				return (addStart + addBraceLabel + addBrace + addDot * .5) * SVG_LINE_HEIGHT;
			case "add-r":
				return addDot * .5 * SVG_LINE_HEIGHT;
			case "add-brace-label":
				return (addStart + addBraceLabel - .2) * SVG_LINE_HEIGHT; // 10% margin
			case "add-brace-top":
				return (addStart + addBraceLabel) * SVG_LINE_HEIGHT; // 10% margin
			case "add-brace-height":
				return addBrace * SVG_LINE_HEIGHT; // 10% top and bottom
		}
		throw new Error(`not handling ${feature} in ypos`);
	}

	function firstTimeSetup(element) {
		//expressionChangeSetup(element, cohdef);
		//setupArrowHeads(element);
	}
	function expressionChangeSetup(element, cohdef) {
		var d3element = d3.select(element);
		d3AddIfNeeded(d3element, [null], 'div', 
															 ['primarycrit','section','header'], 
															 primaryCritHeader, {cohdef});
		d3AddIfNeeded(d3element, [null], 'div', 
															 ['primarycrit','section','body'], 
															 primaryCritBody, {cohdef});
		d3AddIfNeeded(d3element, [null], 'div', 
															 ['addcrit','section','body'], 
															 addCritSectBody,
															 {cohdef, acsect:cohdef.AdditionalCriteria});
		d3AddIfNeeded(d3element, [null], 'div', 
															 ['inclusion','section','header'], 
															 inclusionRulesHeader, 
															 {cohdef, rules:cohdef.InclusionRules});
		d3AddIfNeeded(d3element, [null], 'div', 
															 ['inclusion','section','body'], 
															 inclusionRulesBody, 
															 {cohdef, rules:cohdef.InclusionRules});

		$('div.indent-bar').each(function() { 
			$(this).height($(this).closest('div.row').height()) 
		});
		$('div.name').each(function() { 
			$(this).height($(this).closest('div.row').height()) 
		});
		$('div.cartoon').width(cartoonWidth());
	}
	function d3AddIfNeeded(parentElement, data, tag, classes, firstTimeCb, cbParams) {
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
	function dataSetup(expression) {
		window.expression = expression;
		var cohdef = ko.toJS(expression);
		window.cohdef = cohdef;

		// clone objects (so they can be modified) and add domain names
		addDomainNames(cohdef.PrimaryCriteria, 'primary');
		allGroups(cohdef).forEach(group=>addDomainNames(group, 'additional'))
		cohdef.maxDepth = _.max(allGroups(cohdef).map(d=>d.depth));

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
		width = width || cartoonWidth();
		var extraPx = 25; // room at ends of cartoons for arrows past domain dates
		var extraRatio = extraPx / width; // add to ends of domains

		var obsext = obsExtent(cohdef.PrimaryCriteria.CriteriaList,
												allAdditionalCriteria(cohdef), cohdef);
		if (obsext && !(obsext[0] === 0 && obsext[1] === 0)) {
			var extraDays = extraRatio * (Math.abs(obsext[0]) + Math.abs(obsext[0]));
			cohdef.obsScale.range([0,width])
										.domain([obsext[0] - extraDays, obsext[1] + extraDays])
		}
		//console.log(obsext, cohdef.obsScale.domain(), extraRatio, extraDays);
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
	function subGroups(group, depth=0) { // returns array of this group and its subgroups
		if (!group) return [];
		group.depth = depth;
		if (group.Groups.length)
			return _.flatten([group].concat(group.Groups.map(g=>subGroups(g,depth+1))));
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
			$(window).resize(function() {
				divWidth(element.offsetWidth);
			});
			firstTimeSetup(element);
		},
		update: function (element, valueAccessor, allBindingsAccessor) {
			//console.log('in update');
			if (!divWidth()) {
				return;
			}
			console.log(`update width divWidth ${divWidth()}`);
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
	function primaryCritHeader(d3element, {cohdef}={}) {
		var PrimaryCriteria = cohdef.PrimaryCriteria;
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
		var rightHeader = `
				Duration from Start
						(<svg style="display:inline-block" height="10px" width="10px">
							<circle cx="5" cy="5" r="4" style="fill:green" />
						</svg>)
				<svg height="0" class="x axis col-xs-12"/>`;
		
		var pickadiv = ''; // doesn't matter, as long as it exists. they should all 
											 // be the same width
		var headerHtml = `
						${limitMsg}
						${resultDateMsg}
						<div class="row">
							<div class="col-xs-${12-NAME_COLS} col-xs-offset-${NAME_COLS}">
								<div class="cartoon">
									${rightHeader}
								</div>
							</div>
						</div>`;

		var headerNode = d3AddIfNeeded(d3element, [PrimaryCriteria], 'div', 
																	 ['primary','section-header', 'row'], 
																	skeleton, {cohdef,type:'section-header',depth:0})
		headerNode.select('div.header-content').html(title);

		headerNode = d3AddIfNeeded(d3element, [PrimaryCriteria], 'div', 
																	 ['primary','header', 'row'], 
																	skeleton, {cohdef,type:'header',depth:0})
		headerNode.select('div.header-content').html(headerHtml);

		//d3element.html(headerHtml);
		/* 
		switching to constant width
		var w = $(d3element.select(`div.cartoon`).node()).width();
		resetScales(cohdef, w);
		resetScales(cohdef, CARTOON_WIDTH);
		*/
		resetScales(cohdef);
		d3element.select('svg.x.axis').call(cohdef.obsAxis);
		d3element.select('svg.x.axis').selectAll(".x.axis text") // select all the text elements for the xaxis
						.attr("transform", function(d) {
							return "translate(" + this.getBBox().height*-2 + "," + 
																		this.getBBox().height + ")rotate(-45)";
						});
	}
	function skeleton(selection, {cohdef, type, depth} = {}) {
		// the reason this uses d3 append rather than composing html is to
		// send __data__ down to all the elements
		selection
			.classed(`${type}-row`,true)
		if (type === 'section-header') {
			selection.append('div').attr('class', 'col-xs-12 header-content');
			return;
		}

		if (type === 'header') {
			selection.append('div').attr('class', 'col-xs-12 header-content');
			return;
		}


		selection.append('div').attr('class', `indent-bar col-xs-${INDENT_COLS}`)
		var right = selection.append('div').attr('class', `after-indent col-xs-${12-INDENT_COLS}`)
		right = right.append('div').attr('class','row');
		/*
		if (type === 'header') {
			right.append('div').attr('class', `header-content col-xs-12`)
		} else 
		*/
		if (type === 'subgroup') {
			right.append('div').attr('class', `subgroup-container col-xs-12`)
		} else {
			right.append('div').attr('class', `name col-xs-${NAME_COLS}`)
			right.append('div').attr('class', `col-xs-${12-NAME_COLS}`)
							.append('div').attr('class', 'cartoon')
							.append('svg').attr('class', 'col-xs-12')
														.attr('height',0)
		}
	}
	function critGroupHeader(d3element, {cohdef, critgroup, depth, parentcg, critIndex} = {}) {
		var html = '';
		if (!critgroup) {
			html = 'No criteria group';
		} else {
			var all_any = `Restrict to people matching ${critgroup.Type.toLowerCase()} of the
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
						</svg>)`;
			
			html += `${all_any}${rightHeader}
								<div class="row">
									<div class="col-xs-${12-NAME_COLS} col-xs-offset-${NAME_COLS}">
										<div class="cartoon">
											<svg height="0" class="x axis col-xs-12"/>
										</div>
									</div>
								</div>`;
		}
		var headerNode = d3AddIfNeeded(d3element, [critgroup], 'div', 
																	['crit','header', 'row'], 
																	skeleton, {cohdef,type:'header',
																						depth:Math.max(0, depth)})
		headerNode.select('div.header-content').html(html);

		d3element.select('svg.x.axis').call(cohdef.obsAxis);
		d3element.select('svg.x.axis').selectAll(".x.axis text") // select all the text elements for the xaxis
						.attr("transform", function(d) {
							return "translate(" + this.getBBox().height*-2 + "," + 
																		this.getBBox().height + ")rotate(-45)";
						});
	}
	function primaryCritBody(d3element,{cohdef}={}) {
		var pc = cohdef.PrimaryCriteria;
		pc.CriteriaList.forEach((crit,i) => {
			crit.critIndex = i;
		});
		critBody(d3element, {cohdef, crit:pc, critType:'primary', depth:0});
	}
	function addCritSectBody(d3element, {cohdef, acsect}) {
		var html = '<h3>Additional Criteria</h3>'; 
		if (!acsect)
			html = 'No additional criteria';
		var headerNode = d3AddIfNeeded(d3element, [acsect], 'div', 
																	 ['critgroup','section-header', 'row'], 
																	skeleton, {cohdef,type:'section-header',depth:0})
		headerNode.select('div.header-content').html(html);
		d3AddIfNeeded(d3element, [acsect], 'div', 
															 ['critgroup','section','header'], 
															 critGroupHeader, 
															 {cohdef, critgroup:acsect, depth:0});
		d3AddIfNeeded(d3element, [acsect], 'div', 
															 ['critgroup','section','body'], 
															 critGroupBody,
															 {cohdef, critgroup:acsect, depth:0});
	}
	function critGroupBody(d3element, {cohdef,critgroup, depth} = {}) {
		critgroup.CriteriaList.concat(critgroup.Groups).forEach((crit,i) => {
			crit.critIndex = i;
		});
		critBody(d3element,{cohdef, crit:critgroup, critType:'group', depth});
		if (depth > 3) throw new Error('wait');

		var groupNodes = d3AddIfNeeded(d3element, critgroup.Groups, 'div', 
																	 ['crit','row','subgroup'], 
																	skeleton, {cohdef,type:'subgroup',depth})
		connectorText(groupNodes, critgroup);
		groupNodes.selectAll('div.subgroup-container')
			.each(function(group) {
				var subgroup = d3AddIfNeeded(d3.select(this), [group], 'div', 
																	['critgroup','subgroup','header'], 
																	critGroupHeader, 
																	{cohdef, critgroup:group, depth:depth+1,
																		parentcg:critgroup,critIndex:group.critIndex});
				connectorText(subgroup, group, 'subgroup');
				d3AddIfNeeded(d3.select(this), [group], 'div', 
																	['critgroup','subgroup','body'], 
																	critGroupBody,
																	{cohdef, critgroup:group, depth:depth+1,
																		parentcg:critgroup,critIndex:group.critIndex});
			});
	}
	function connectorText(nodes, parentcrit, subgroup) {
		var groupMsg, groupConnector;
		if (parentcrit.PrimaryCriteriaLimit) {
			groupMsg = `${parentcrit.PrimaryCriteriaLimit.Type} of`;
			groupConnector = 'or';
		} else {
			groupMsg = `${parentcrit.Type[0]}${parentcrit.Type.slice(1).toLowerCase()} of`;
			if (parentcrit.Type.match(/^AT/))
				groupMsg = `At ${parentcrit.Type.slice(3).toLowerCase()} ${parentcrit.Count} of`;
			groupConnector = parentcrit.Type === 'ALL' ? 'and' : 'or';
		}

		nodes.selectAll('div.indent-bar')
							.html(function(crit) {
								if (!crit.critIndex || subgroup) return groupMsg;
								d3.select(this).style('text-align','right');
								return groupConnector;
								return `${depth}/${cohdef.maxDepth}:${crit.critIndex}`;
							});

	}
	function critBody(d3element, {cohdef, crit, critType, depth} = {}) {
		var crits = crit.CriteriaList;
		var critNodes = d3AddIfNeeded(d3element, crits, 'div', ['crit','row'], 
																	skeleton, {cohdef,type:'crit',depth})
		connectorText(critNodes, crit);
		critNodes.selectAll('div.name')
							.call(critName, cohdef, critType);

		critNodes.selectAll('div.cartoon > svg')
							.call(drawCrits, cohdef, critType);
	}
	function drawCrits(selection, cohdef, critType) {
		selection.each(function(_crit) {
			var el = d3.select(this); // the svg
			var crit = _crit;
			var html = '';
			el.attr('height', ypos(crit, 'svg-height', critType, $(this).closest('div.row')));

			var durRange = getRange(crit, 'dur');
			if (durRange) {
				html += durInterval(durRange, crit, cohdef, critType);
			}
			html += obsPeriodShading(crit, cohdef, critType, this);
			html += dateSymbols(crit, cohdef, critType)

			if (critType === 'primary') {
				el.html(html);
				return;
			}
			if (critType === 'group') {
				crit = _crit.Criteria;
				var sw = _crit.StartWindow;
				var swin = [sw.Start.Coeff * sw.Start.Days, sw.End.Coeff * sw.End.Days];
				var fixedWindow = true;
				if (sw.Start.Days === null) {
					//swin[0] = null;
					swin[0] = cohdef.obsExt[0];
					fixedWindow = false;
				}
				if (sw.End.Days === null) {
					//swin[1] = null;
					swin[1] = cohdef.obsExt[1];
					fixedWindow = false;
				}

				html += swPeriodBrace(crit, _crit, cohdef, swin);

				if (fixedWindow) {
					html += 
						interval(
							symbol({term:'start', crit:'window', inclusive:'true', x:swin[0], y:15, r:4}, cohdef),
							symbol({term:'end', crit:'window', inclusive:'true', x:swin[1], y:15, r:4}, cohdef),
							{fixed:true, x1:swin[0], x2:swin[1]}, cohdef);
				} else {
					if (sw.Start.Days === null && sw.End.Days === null) {
						// do something
					} else if (sw.Start.Days === null) {
						html += 
							interval(
								'',
								symbol({term:'end', crit:'window', inclusive:'true', x:swin[1], y:15, r:4}, cohdef),
								{fixed:false, x1:cohdef.obsExt[0], x2:swin[1],
									markerStart:'left'}, cohdef);
					} else if (sw.End.Days === null) {
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
	function inclusionRulesHeader(d3element, {cohdef, rules} = {}) {
		var html = '<h3>Inclusion Rules</h3>'; 
		if (!rules)
			html = 'No inclusion rules';
		var headerNode = d3AddIfNeeded(d3element, [rules], 'div', 
																	 ['primary','section-header', 'row'], 
																	skeleton, {cohdef,type:'section-header',depth:0})
		headerNode.select('div.header-content').html(html);
	}
	function inclusionRulesBody(d3element, {cohdef, rules} = {}) {
		rules.forEach(function(rule) {
			var rulediv = d3element.append('div');
			d3AddIfNeeded(rulediv, [rule], 'div', 
																['critgroup','section','header'], 
																inclusionRuleHeader, 
																{cohdef, rule, depth:0});
			d3AddIfNeeded(rulediv, [rule], 'div', 
																['critgroup','section','body'], 
																inclusionRuleBody,
																{cohdef, rule, depth:0});
		});
	}
	function inclusionRuleBody(d3element, {cohdef, rule, depth} = {}) {
		d3AddIfNeeded(d3element, [rule.expression], 'div', 
															 ['critgroup','section','header'], 
															 critGroupHeader, 
															 {cohdef, critgroup:rule.expression, depth:0});
		d3AddIfNeeded(d3element, [rule.expression], 'div', 
															 ['critgroup','section','body'], 
															 critGroupBody,
															 {cohdef, critgroup:rule.expression, depth:0});
	}
	function inclusionRuleHeader(d3element, {cohdef, rule, depth} = {}) {
		var html = `<h4>${rule.name}</h4>${rule.description}`; 
		var headerNode = d3AddIfNeeded(d3element, [rule], 'div', 
																	 ['primary','section-header', 'row'], 
																	skeleton, {cohdef,type:'section-header',depth:0})
		headerNode.select('div.header-content').html(html);
	}
	function critName(selection, cohdef, critType) {
		selection.each(function(_crit) {
			var crit = critType === 'group' ? _crit.Criteria : _crit;
			var text = `${critLabel(crit, cohdef)}`;
			var verbose = `<span style="opacity:0.2">${critCartoonText(crit)}</span>`;
			if (critType === 'group')
				verbose += `<span style="opacity:0.2">
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
	function durInterval(range, crit, cohdef, critType) {
		var html = '';
		if (critType === 'group') debugger;
		if (rangeInfo(range, 'single-double') === 'single') {
			var y = ypos(crit, 'index-dot', critType);
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
					return '<text y="6">not handling duration less than yet</text>';
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
					return '<text y="6">not handling duration equal to yet</text>';
					el.append('line')
								.attr('y1', 10)
								.attr('y2', 10)
								.attr('x1', cohdef.obsScale(0))
								.attr('x2', cohdef.obsScale(range.Value))
								.style(`marker-start`, `url(#line-stop)`)
								.style(`marker-end`, `url(#line-stop)`)
				default: // eq
					return `<text y="6">not handling duration ${range.Op} yet</text>`;
			}
		} else {
			return `<text y="6">not handling duration ${rangeInfo(range,'nice-op')} yet</text>`;
		}
	}
	function dateSymbols(crit, cohdef, critType) {
		var html = '';
		var durRange = getRange(crit, 'dur');
		var startDateRange = getRange(crit, 'start');
		var endDateRange = getRange(crit, 'end'); // ignore these?
		if (endDateRange) {
			html += `<text y="13">not handling end dates</text>`;
		}
		if (startDateRange) {
			var y = ypos(crit, 'dates', critType);
			var r = ypos(crit, 'index-r', critType);
			var xIndex = 0;
			//var xEdge = cohdef.obsExt[0];
			var circle = symbol({term:'start', crit:'primary', 
														inclusive:startDateRange.Op.match(/e/), 
														x:xIndex, y, r}, cohdef);
			var whichSide = 1;
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
	function obsPeriodShading(crit, cohdef, critType, svg) {
		//var height = ypos(crit, 'svg-height', critType, $(svg).closest('div.row'));
		var height = $(svg).height();
		var prior = Math.abs(cohdef.PrimaryCriteria.ObservationWindow.PriorDays);
		var post = cohdef.PrimaryCriteria.ObservationWindow.PostDays;
		var dotY = ypos(crit, 'index-dot', critType);
		var dotR = ypos(crit, 'index-r', critType);
		var leftEdge = cohdef.obsScale.range()[0];
		var leftWidth = cohdef.obsScale(-prior);
		var rightEdge = cohdef.obsScale.range()[1];
		var rightWidth = rightEdge - cohdef.obsScale(post);

		var indexMarker = markerText(crit);
		if (indexMarker) {
			indexMarker = `<text x="${cohdef.obsScale(0)}" y="${dotY}"
														text-anchor="middle" 
														alignment-baseline="top"
														class="index-marker">${indexMarker}</text>`;
		} else {
			indexMarker = `<rect x="${cohdef.obsScale(0) - 1}" 
			                     y="0" width="2" height="${height}" 
													class="index-marker" />`;
		}
		//var indexDateDot = symbol({term:'start', crit:'primary', inclusive:'true', x:0, y:dotY, r:dotR}, cohdef);
		var html = `
				${indexMarker}
				<rect x="${leftEdge}" y="0" width="${leftWidth}" height="${height}" class="not-obs" />
				<rect x="${rightEdge - rightWidth}" y="0" width="${rightWidth}" height="${height}" class="not-obs" />
		`;
		return html;
	}
	function markerText(crit, addcrit) {
		var text = ''
		if (crit.First) {
			text += '1st';
		}
		var count = '';
		if (addcrit) {
			if (text.length) text += ' ';
			var oc = addcrit.Occurrence;
			// types: 'exactly','at most','at least'
			switch (oc.Type) {
				case 0:
					if (oc.Count === 0) {
						count += 'None';
					} else {
						count += `= ${oc.Count}`;
					}
					break;
				case 1:
						count += `<= ${oc.Count}`;
					break;
				case 2:
						count += `>= ${oc.Count}`;
					break;
			}
		}
		return text + count;
	}
	function swPeriodBrace(crit, addcrit, cohdef, swin) {
		var durRange = getRange(crit, 'dur');
		var startDateRange = getRange(crit, 'start');
		var endDateRange = getRange(crit, 'end'); // ignore these?

		var critType = 'group'; // kludgy
		var dotY = ypos(crit, 'add-dot', critType);
		var dotR = ypos(crit, 'add-r', critType);
		var braceTop = ypos(crit, 'add-brace-top', critType);
		var braceLabel = ypos(crit, 'add-brace-label', critType);
		var braceHeight = ypos(crit, 'add-brace-height', critType);
		var braceLeft = cohdef.obsScale(swin[0]);
		var braceRight = cohdef.obsScale(swin[1]);
		var braceMid = (braceLeft + braceRight) / 2;
		var braceMidDays = (swin[0] + swin[1]) / 2;

		var addCritDot = ''; //symbol({term:'start', crit:'additional', inclusive:'true', x:braceMidDays, y:dotY, r:dotR}, cohdef);
		var oc = addcrit.Occurrence;
		var howMany = `
				<text x="${braceMid}"
							y="${dotY}"
							class="addcrit-marker"
							text-anchor="middle" 
							text-anchor="top">${markerText(crit, addcrit)}</text>
				`;
		var html = `
				${addCritDot}
				${howMany}
				<text x="${braceLeft}"
							y="${braceLabel}"
							text-anchor="middle">${swin[0]}</text>
				<text x="${braceRight}"
							y="${braceLabel}"
							text-anchor="middle">${swin[1]}</text>
				<text x="${braceMid}"
							y="${braceLabel}"
							text-anchor="top">criteria start</text>
				<path class="curly-brace" 
							d="${ makeCurlyBrace(
																braceLeft,
																braceTop,
																braceRight,
																braceTop,
																braceHeight,
																0.6,
																braceMid)}" />
		`;
		return html;
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
