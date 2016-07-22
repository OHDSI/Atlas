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
		left: 'm 5 -5 l -10 5 l 10 5 z',
		stop: 'm -.5 -5 l 1 0 l 0 10 l -1 0 z',
	};
	function ypos(crit, feature, critType='primary',element) {
		var durRange = getRange(crit, 'dur');
		var startDateRange = getRange(crit, 'start');
		//var endDateRange = getRange(crit, 'end'); // ignore these?

		// sections
		// getting rid of top brace
		// var brace = true, dot = true, dur = !!durRange, dates = !!startDateRange;
		var brace = false, dot = (critType==='primary'), dur = false, dates = false;

		// additional sections  (critType is group, which should maybe change)
		var addBrace = false,
				addDot = false,
				addDates = false,
				addDur = false;

		if (critType === 'primary') {
			if (startDateRange)
				dates = true;
			if (durRange)
				dur = true;
		} else {
			addBrace = true;
			addDot = true;
			if (startDateRange)
				addDates = true;
			if (durRange)
				addDur = true;
		}

		var topMargin = .1;
		var bottomMargin = .1;
		var braceLabel = brace ? 1 : 0;		// first line if brace present
		brace = brace ? 1.5 : 0;					// next 1.5 lines if brace present
		dot = dot ? 1 : 0;
		dur = dur ? 1 : 0;								// put with dot	
		var durText = dur ? 1 : 0;
		dates = dates ? 1 : 0;

		var addBraceLabel = addBrace ? 0 : 0; // removing brace label
		addBrace = addBrace ? 1.5 : 0;
		addDot = addDot ? 1 : 0;
		addDur = addDur ? 1 : 0;
		var addDurLabel = addDur ? 1 : 0;
		addDates = addDates ? 1 : 0;

		var topLines = topMargin + braceLabel + brace + dot + dur + durText + dates;
		var lines = topLines 
								+ addBraceLabel + addBrace + addDot + addDur + addDurLabel + addDates
								+ bottomMargin;

		switch (feature) {
			case "svg-height":
				return Math.max(
								Math.max(1, lines) * SVG_LINE_HEIGHT,
								(element ? $(element).height() : 0));
			case "brace-label":
				return (topMargin) * SVG_LINE_HEIGHT;
			case "brace-top":
				return (topMargin + braceLabel) * SVG_LINE_HEIGHT;
			case "brace-height":
				return brace * SVG_LINE_HEIGHT;
			case "index-dot":
				return (topMargin + brace + braceLabel + dot * .5) * SVG_LINE_HEIGHT;
			case "index-r":
				return dot * .25 * SVG_LINE_HEIGHT;
			case "dur":
				return (topMargin + brace + braceLabel + dot + dur * .3) * SVG_LINE_HEIGHT;
			case "dur-text":
				return (topMargin + brace + braceLabel + dot + dur) * SVG_LINE_HEIGHT;
			case "dates-label":
				return (topMargin + brace + braceLabel + dot + dur) * SVG_LINE_HEIGHT;
			case "dates-dot":
				return (topMargin + brace + braceLabel + dot + dur + dates * .5) * SVG_LINE_HEIGHT;
			case "sec-header-height":
				return 35;
			case "header-height":
				return 30;

			case "add-dot":
				return (topLines + addBraceLabel + addBrace + addDot * .5) * SVG_LINE_HEIGHT;
			case "add-dot-label":  // for when dot is replaced by label (alwasy?)
				return (topLines + addBraceLabel + addBrace) * SVG_LINE_HEIGHT;
			case "add-r":
				return addDot * .25 * SVG_LINE_HEIGHT;
			case "add-dur":
				return (topLines + addBraceLabel + addBrace + addDot + addDur * .3) * SVG_LINE_HEIGHT;
			case "add-dur-text":
				return (topLines + addBraceLabel + addBrace + addDot + addDur) * SVG_LINE_HEIGHT;
			case "add-brace-label":
				return (topLines) * SVG_LINE_HEIGHT;
			case "add-brace-top":
				return (topLines + addBraceLabel) * SVG_LINE_HEIGHT;
			case "add-brace-height":
				return addBrace * SVG_LINE_HEIGHT;
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
	function startWindow(sw, ext) {
		// for 'All' days before or after, go to edge of cartoon
		// ext should either be cohdef.obsExt or cohdef.obsScale.domain()
		var swin = [sw.Start.Coeff * sw.Start.Days, sw.End.Coeff * sw.End.Days];
		if (sw.Start.Days === null) { 
			swin[0] = ext[sw.Start.Coeff === -1 ? 0 : 1];
		}
		if (sw.End.Days === null) {
			swin[1] = ext[sw.End.Coeff === -1 ? 0 : 1];
		}
		return swin.sort(d3.ascending); // should it be sorted or is that excessive hand holding?
	}
	function durExt(crit, ext, shift, op) { // from start to longest possible duration
		if (crit.Criteria) { // additional, starts at midpoint of StartWindow
			var range = getRange(crit.Criteria, 'dur');
			var durDays = rangeInfo(range, 'max');
			var sw = startWindow(crit.StartWindow, ext);
			var start = (sw[0] + sw[1]) / 2;
			if (shift && (start+durDays)>ext[1]) {
				start = ext[1] - durDays;
			}
			if (op === "bt")
				return [start, start+range.Value, start+range.Extent];
			if (op === "!bt")
				return [0, range.Value, range.Extent, ext[1]];
			return [start, start + durDays];
		} else {						 // primary, starts at index date
			var range = getRange(crit, 'dur');
			if (op === "bt")
				return [0, range.Value, range.Extent];
			if (op === "!bt")
				return [0, range.Value, range.Extent, ext[1]];
			var durDays = rangeInfo(range, 'max');
			return [0, durDays];
		}
	}
	function obsExtent(primCrits, addCrits, cohdef) {
		var primDurs = primCrits.map(crit=>durExt(crit)[1]);
		var swins = _.flatten(addCrits.map(crit=>startWindow(crit.StartWindow,[0,0])));
		var obsDays = [-cohdef.PrimaryCriteria.ObservationWindow.PriorDays, 
										cohdef.PrimaryCriteria.ObservationWindow.PostDays];
		var allDayOffsets = _.flatten([primDurs, swins, obsDays])
		if (!allDayOffsets.length) return;

		var ext = d3.extent(allDayOffsets);
		var addDurs = _.flatten(addCrits.map(crit=>durExt(crit, ext)));

		allDayOffsets = allDayOffsets.concat(addDurs);
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
			//console.log(`update width divWidth ${divWidth()}`);
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
			var crit = critType === 'primary' ? _crit : _crit.Criteria;
			el.attr('height', ypos(crit, 'svg-height', critType, $(this).closest('div.row')));
			var html = '';
			html += obsPeriodShading(crit, cohdef, critType, this);
			var ds = dateSymbols(crit, cohdef, critType);
			if (ds.length) {
				html += dateSymbols(crit, cohdef, critType)
			} else {
				var yDot = ypos(crit, 'dates-dot', critType);
				var r = ypos(crit, 'index-r', critType);
				var xIndex = 0;
				var circle = symbol({term:'start', critType, 
														inclusive:true,
														x:xIndex, y:yDot, r}, cohdef);
			}

			if (critType === 'primary') {
				html += durInterval(crit, cohdef, critType);
			} else if (critType === 'group') {
				html += durInterval(crit, cohdef, critType, _crit);
				var sw = _crit.StartWindow;
				var swin = startWindow(sw, cohdef.obsExt);
				html += swPeriodBrace(crit, _crit, cohdef, swin);
			}
			el.html(html);
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
			d3.select(this).html(text + verbose);
			//d3.select(this).html(text);
		})
	}
	function symbol(opts, cohdef) {
		var tag = 'circle';
		var classes = [
					`term-${opts.term}`,
					`crit-${opts.critType}`,
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
			line += `<path d="M ${x(opts.x1)} ${y} ${arrows[opts.markerStart]}" 
									class="term-${opts.term}
														  ${opts.filled ? 'filled' : 'no-fill'}
												" />`;
		}
		if (opts.markerEnd) {
			line += `<path d="M ${x(opts.x2)} ${y} ${arrows[opts.markerEnd]}" 
									class="term-${opts.term}
														  ${opts.filled ? 'filled' : 'no-fill'}
												" />`;
		}
		return `
						${sym1}
						${sym2}
						${line}`;
	}
	function durInterval(crit, cohdef, critType, addcrit) {
		var range = getRange(crit, 'dur');
		if (!range) return '';
		var html = '', y;
		if (critType === 'primary') {
			var yLine = ypos(crit, 'dur', critType);
			var yText = ypos(crit, 'dur-text', critType);
			var durext = durExt(crit, cohdef.obsExt, false, range.Op);
		} else {
			var yLine = ypos(crit, 'add-dur', critType);
			var yText = ypos(crit, 'add-dur-text', critType);
			var durext = durExt(addcrit, cohdef.obsExt, true, range.Op);
		}
		var filledArrow = range.Op.length === 3 && range.Op[2] === 'e'; // lte or gte
		var textCenter = 0;
		if (rangeInfo(range, 'single-double') === 'single') {
			switch (range.Op[0]) {
				case "g": // gt or gte
					html += interval('','', {fixed:true, x1:durext[0], 
																	 x2:durext[1], y:yLine,
																	 markerStart:'stop',
																	 markerEnd:'right',
																	 filled: filledArrow,
																	 term:'dur'
																	}, cohdef);
					html += interval('','', {fixed:false, x1:durext[1], 
																	 x2:cohdef.obsExt[1], y:yLine,
																	 markerEnd:'right',
																	 filled: filledArrow,
																	 term:'dur'
																	}, cohdef);
					textCenter = (durext[0] + cohdef.obsExt[1]) / 2;
					break;
				case "l": // lt or lte
					html += interval('','', {fixed:true, x1:durext[0], 
																	 x2:durext[1], y:yLine,
																	 markerStart:'stop',
																	 markerEnd:'left',
																	 filled: filledArrow,
																	 term:'dur'
																	}, cohdef);
					textCenter = (durext[0] + durext[1]) / 2;
					break;
				case "e": // eq
					html += interval('','', {fixed:true, x1:durext[0], 
																	 x2:durext[1], y:yLine,
																	 markerStart:'stop',
																	 markerEnd:'stop',
																	 term:'dur'
																	}, cohdef);
					textCenter = (durext[0] + durext[1]) / 2;
					break;
				default:
					return `<text y="9">not handling duration ${range.Op} yet</text>`;
			}
		} else {
			textCenter = _.sum(d3.extent(durext)) / 2;
			if (range.Op === "bt") {
				if (durext.length !== 3) 
					throw new Error("problem with durExt");
				html += interval('','', {fixed:true, x1:durext[0], 
																	x2:durext[1], y:yLine,
																	markerStart:'stop',
																	markerEnd:'right',
																	filled: filledArrow,
																	term:'dur'
																}, cohdef);
				html += interval('','', {fixed:false, x1:durext[1], 
																	x2:durext[2], y:yLine,
																	markerStart:'right',
																	markerEnd:'left',
																	filled: filledArrow,
																	term:'dur'
																}, cohdef);
			} else {
				return `<text y="9">not handling duration ${rangeInfo(range,'nice-op')} yet</text>`;
			}
		}
		html += `
							<text x="${cohdef.obsScale(textCenter)}"
										y="${yText}"
										dominant-baseline="hanging"
										text-anchor="middle"
							>${durText(crit)}</text>
		`;
		return html;
	}
	function dateSymbols(crit, cohdef, critType) {
		var html = '';
		var startDateRange = getRange(crit, 'start');
		var endDateRange = getRange(crit, 'end'); // ignore these?
		if (endDateRange) {
			html += `<text y="18">not handling end dates</text>`;
		}
		if (startDateRange) {
			var yDot = ypos(crit, 'dates-dot', critType);
			var yLabel = ypos(crit, 'dates-label', critType);
			var r = ypos(crit, 'index-r', critType);
			var xIndex = 0;
			//var xEdge = cohdef.obsExt[0];
			var circle = symbol({term:'start', critType,
														inclusive:startDateRange.Op.match(/e/), 
														x:xIndex, y:yDot, r}, cohdef);
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
												y="${yLabel}"
												dominant-baseline="hanging"
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
			indexMarker = `<text x="${cohdef.obsScale(0) - 3}" y="${dotY}"
														text-anchor="end" 
														dominant-baseline="hanging"
														class="index-marker">${indexMarker}</text>`;
		}
		indexMarker += `<rect x="${cohdef.obsScale(0) - 1}" 
													y="0" width="2" height="${height}" 
												class="index-marker" />`;
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
		var count = '';
		if (addcrit) {
			if (text.length) text += ' ';
			var oc = addcrit.Occurrence;
			// types: 'exactly','at most','at least'
			switch (oc.Type) {
				case 0:
					if (oc.Count === 0) {
						count += 'Zero';
					} else {
						count += `Exactly ${oc.Count}`;
					}
					break;
				case 1:
						count += `At most ${oc.Count}`;
					break;
				case 2:
						count += `At least ${oc.Count}`;
					break;
			}
			count += ` ${oc.IsDistinct ? 'distinct' : ''} occurrence${oc.Count===1 ? '' : 's'}`;
		} else {
			if (crit.First) {
				text += '1st';
			}
		}
		return text + count;
	}
	function swPeriodBrace(crit, addcrit, cohdef, swin) {
		var startDateRange = getRange(crit, 'start');
		var endDateRange = getRange(crit, 'end'); // ignore these?

		var critType = 'group'; // kludgy
		var dotY = ypos(crit, 'add-dot', critType);
		var dotLabel = ypos(crit, 'add-dot-label', critType);
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
							y="${dotLabel}"
							class="addcrit-marker"
							text-anchor="middle" 
							dominant-baseline="hanging">${markerText(crit, addcrit)}</text>
				`;
			/*
				<text x="${braceLeft}"
							y="${braceLabel}"
							text-anchor="middle">${swin[0]}</text>
				<text x="${braceRight}"
							y="${braceLabel}"
							text-anchor="middle">${swin[1]}</text>
				<text x="${braceMid}"
							y="${braceLabel}"
							text-anchor="top">criteria start</text>
			*/
		var html = `
				${addCritDot}
				${howMany}
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
	function getRange(crit, feature) {
		if (crit.Criteria)
			throw new Error("wrong kind of crit");
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
	function durType(crit) {
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
	function durText(crit) {
		var range = getRange(crit, 'dur');
		var dur = 'any duration';
		if (range) {
			dur = `${durType(crit)} ${rangeInfo(range,'nice-op')} `;
			if (rangeInfo(range, 'single-double') === 'single') {
				dur += `${rangeInfo(range, 'val')} days`;
			} else {
				dur += `${rangeInfo(range, 'lower')} and ${rangeInfo(range, 'upper')} days`;
			}
		}
		return dur;
	}
	function critCartoonText(crit) {
		var dur = durText(crit);
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
