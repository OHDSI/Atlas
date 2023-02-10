"use strict";
define(['knockout', 'd3', 'd3-tip', 'lodash'],
	function (ko, d3, d3tip, _) {

		var divWidth = ko.observable(); // triggers update
		var cartoonWidth = ko.computed(function () {
			return divWidth() * 0.6;
		});
		const INDENT_COLS = 1; // for the whole leftmost column
		const NAME_COLS = 2;
		const SVG_LINE_HEIGHT = 17;
		const arrows = {
			right: 'm -5 -5 l 10 5 l -10 5 z',
			//right: 'M 2 2 L 8 5 L 2 8 z',
			left: 'm 5 -5 l -10 5 l 10 5 z',
			stop: 'm -.5 -5 l 1 0 l 0 10 l -1 0 z',
		};

		function ypos(crit, feature, critType = 'primary', element) {
			var durRange = getRange(crit, 'dur');
			var startDateRange = getRange(crit, 'start');
			//var endDateRange = getRange(crit, 'end'); // ignore these?

			// sections
			// getting rid of top brace
			// var brace = true, dot = true, dur = !!durRange, dates = !!startDateRange;
			var brace = false,
				dot = (critType === 'primary'),
				dur = false,
				dates = false;

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
			var braceLabel = brace ? 1 : 0; // first line if brace present
			brace = brace ? 1.5 : 0; // next 1.5 lines if brace present
			dot = dot ? 1 : 0;
			dur = dur ? 1 : 0; // put with dot
			var durText = dur ? 1 : 0;
			dates = dates ? 1 : 0;

			var addBraceLabel = addBrace ? 0 : 0; // removing brace label
			addBrace = addBrace ? 1.5 : 0;
			addDot = addDot ? 1 : 0;
			addDur = addDur ? 1 : 0;
			var addDurLabel = addDur ? 1 : 0;
			addDates = addDates ? 1 : 0;

			var topLines = topMargin + braceLabel + brace + dot + dur + durText + dates;
			var lines = topLines +
				addBraceLabel + addBrace + addDot + addDur + addDurLabel + addDates +
				bottomMargin;

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
					return (topMargin + brace + braceLabel + dot + dur + dates * .3) * SVG_LINE_HEIGHT;
				case "sec-header-height":
					return 35;
				case "header-height":
					return 30;

				case "add-dot":
					return (topLines + addBraceLabel + addBrace + addDot * .3) * SVG_LINE_HEIGHT;
				case "add-dot-label": // for when dot is replaced by label (alwasy?)
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
			d3AddIfNeeded(d3element, [null], 'div', ['primarycrit', 'section', 'header'],
				primaryCritHeaderAdd, primaryCritHeaderUpdate, {
					cohdef
				});
			d3AddIfNeeded(d3element, [null], 'div', ['primarycrit', 'section', 'body', 'paddedWrapper'],
				null,
				primaryCritBodyUpdate, {
					cohdef
				});
			d3AddIfNeeded(d3element, [null], 'div', ['addcrit', 'section', 'body', 'paddedWrapper'],
				addCritSectBodyAdd,
				addCritSectBodyUpdate, {
					cohdef,
					acsect: cohdef.AdditionalCriteria
				});
			d3AddIfNeeded(d3element, [null], 'div', ['inclusion', 'section', 'header'],
				null,
				inclusionRulesHeaderUpdate, {
					cohdef,
					rules: cohdef.InclusionRules
				});
			d3AddIfNeeded(d3element, cohdef.InclusionRules, 'div', ['inclusion', 'section', 'body', 'paddedWrapper'],
				inclusionRulesBodyAdd,
				inclusionRulesBodyUpdate, {
					cohdef,
					rules: cohdef.InclusionRules
				});

			/*
			$('div.indent-bar').each(function() {
				$(this).height($(this).closest('div.row').height())
			});
			$('div.name').each(function() {
				$(this).height($(this).closest('div.row').height())
			});
			*/
			$('div.cartoon').width(cartoonWidth());
			$('[data-toggle="tooltip"]').tooltip();
		}

		function d3AddIfNeeded(parentElement, data, tag, classes, addCb, updateCb, cbParams) {
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
				.each(function (d) {
					var newNode = d3.select(this);
					classes.forEach(cls => {
						newNode.classed(cls, true);
					});
				})
				.call(addCb || function () {}, cbParams);
			selection = d3element.selectAll([tag].concat(classes).join('.'));
			selection.call(updateCb || function () {}, cbParams);
			return selection;
		}

		function dataSetup(expression) {
			window.expression = expression;
			var cohdef = ko.toJS(expression);
			window.cohdef = cohdef;

			getCrits(cohdef, 'primary', 'crit').forEach(
				(crit, i) => Object.defineProperty(crit, '_critIndex', {
					value: i,
					configurable: true
				}));

			getGroups(cohdef, 'top').forEach(group => numberGroupItems(cohdef, group));

			cohdef.maxDepth = _.max(getGroups(cohdef, "all").map(d => d._depth));

			var obsext = obsExtent(cohdef)
			cohdef.obsExt = obsext;
			cohdef.obsScale = d3.scaleLinear();
			cohdef.obsAxis = d3.axisTop().scale(cohdef.obsScale);
			return cohdef;
			/*
			if (obsext && !(obsext[0] === 0 && obsext[1] === 0)) {
				cohdef.columns.push('obs');
			}
			*/
		}

		function numberGroupItems(cohdef, group) {
			group.CriteriaList.concat(group.Groups).forEach(
				(g, i) => Object.defineProperty(getCrit('critorgroup', g), '_critIndex', {
					value: i,
					configurable: true
				})
			);
			group.Groups.forEach(g => numberGroupItems(cohdef, g));
		}

		function getCrits(cohdef, which, returnType) {
			var list;
			switch (which) {
				case "primary":
					list = cohdef.PrimaryCriteria.CriteriaList;
					break;
				case "all-additional-crits":
					list = (_.chain(getGroups(cohdef, "all"))
						.flatten()
						.map(d => d.CriteriaList)
						.flatten()
						.value());
					break;
			}
			return list.map(getCrit(returnType));
		}

		function getGroups(cohdef, which) {
			switch (which) {
				case "top":
					return (cohdef.AdditionalCriteria ? [cohdef.AdditionalCriteria] : []).concat(cohdef.InclusionRules.map(d => d.expression));
				case "all":
					return getGroups(cohdef, "top").map(subGroups);
			}
		}
		var getCrit = _.curry(function (feature, crit) {
			switch (feature) {
				case "additional":
					if (crit.Criteria)
						return crit;
					throw new Error("not an additional crit");
				case "wrapper": // the single-property object with key=domain, val=crit
					if (crit._isWrapper) return crit;
					var wrapper = crit.Criteria || crit;
					Object.defineProperty(wrapper, '_isWrapper', {
						value: true,
						configurable: true
					});
					var kv = _.toPairs(wrapper);
					if (kv.length !== 1)
						throw new Error("can't find wrapper in crit");
					if (!kv[0][1]._domain) {
						Object.defineProperty(kv[0][1], '_domain', {
							value: kv[0][0],
							configurable: true
						});
						Object.defineProperty(kv[0][1], '_plainCrit', {
							value: true,
							configurable: true
						});
					}
					return wrapper;
				case "domain":
					return crit._domain || _.keys(getCrit("wrapper", crit))[0];
				case "critorgroup":
					if (crit.Groups) return crit;
				case "crit":
					if (crit._plainCrit) return crit;
					return getCrit("wrapper", crit)[getCrit("domain", crit)];
			}
		});

		function resetScales(cohdef, width) {
			width = width || cartoonWidth();
			var extraPx = 25; // room at ends of cartoons for arrows past domain dates
			var extraRatio = extraPx / width; // add to ends of domains

			var obsext = obsExtent(cohdef);
			if (obsext && !(obsext[0] === 0 && obsext[1] === 0)) {
				var extraDays = extraRatio * (Math.abs(obsext[0]) + Math.abs(obsext[0]));
				cohdef.obsScale.range([0, width])
					.domain([obsext[0] - extraDays, obsext[1] + extraDays])
			}
			//console.log(obsext, cohdef.obsScale.domain(), extraRatio, extraDays);
			cohdef.obsExt = obsext;
			//console.log(cohdef.obsScale.domain());
		}

		function subGroups(group, depth = 0) { // returns array of this group and its subgroups
			if (!group) return [];
			Object.defineProperty(group, '_depth', {
				value: depth,
				configurable: true
			});
			if (group.Groups.length)
				return _.flatten([group].concat(group.Groups.map(g => subGroups(g, depth + 1))));
			return [group]
		}

		function startWindow(sw, ext) {
			// for 'All' days before or after, go to edge of cartoon
			// ext should either be cohdef.obsExt or cohdef.obsScale.domain()
			var swin = [sw.Start.Coeff * sw.Start.Days, sw.End.Coeff * sw.End.Days];
			if (sw.Start.Days === null) {
				swin[0] = ext[sw.Start.Coeff === -1 ? 0 : 1];
				swin.noStart = true;
			}
			if (sw.End.Days === null) {
				swin[1] = ext[sw.End.Coeff === -1 ? 0 : 1];
				swin.noEnd = true;
			}
			return swin.sort(d3.ascending); // should it be sorted or is that excessive hand holding?
		}

		function durExt(crit, ext, shift, op) { // from start to longest possible duration
			if (crit.Criteria) { // additional, starts at midpoint of StartWindow
				var range = getRange(crit.Criteria, 'dur');
				var durDays = rangeInfo(range, 'max');
				var sw = startWindow(crit.StartWindow, ext);
				var start = (sw[0] + sw[1]) / 2;
				if (shift && (start + durDays) > ext[1]) {
					start = ext[1] - durDays;
				}
				if (op === "bt")
					return [start, start + range.Value, start + range.Extent];
				if (op === "!bt")
					return [0, range.Value, range.Extent, ext[1]];
				return [start, start + durDays];
			} else { // primary, starts at index date
				var range = getRange(crit, 'dur');
				if (op === "bt")
					return [0, range.Value, range.Extent];
				if (op === "!bt")
					return [0, range.Value, range.Extent, ext[1]];
				var durDays = rangeInfo(range, 'max');
				return [0, durDays];
			}
		}

		function obsExtent(cohdef) {
			var primCrits = getCrits(cohdef, "primary", "crit");
			var addCrits = getCrits(cohdef, "all-additional-crits", "additional");
			var primDurs = primCrits.map(crit => durExt(crit)[1]);
			var swins = _.flatten(addCrits.map(crit => startWindow(crit.StartWindow, [0, 0])));
			var obsDays = [-cohdef.PrimaryCriteria.ObservationWindow.PriorDays,
				cohdef.PrimaryCriteria.ObservationWindow.PostDays
			].map(d => parseInt(d));
			var allDayOffsets = _.flatten([primDurs, swins, obsDays])
			if (!allDayOffsets.length) return;

			var ext = d3.extent(allDayOffsets);
			var addDurs = _.flatten(addCrits.map(crit => durExt(crit, ext)));

			allDayOffsets = allDayOffsets.concat(addDurs);
			return d3.extent(allDayOffsets);
		}

		ko.bindingHandlers.cohortExpressionCartoon = {
			init: function (element, valueAccessor, allBindingsAccessor) {
				// update when dom element is displayed and has width
				$(window).resize(function () {
					divWidth(element.offsetWidth);
				});
				valueAccessor().delayedCartoonUpdate.subscribe(function () {
					divWidth(element.offsetWidth);
				});
				firstTimeSetup(element);
			},
			update: function (element, valueAccessor, allBindingsAccessor) {
				if (!divWidth()) {
					return;
				}
				var expression = valueAccessor().expression();

				if (valueAccessor().tabPath() !== "export/cartoon") {
					return;
				}
				var cohdef = dataSetup(expression);
				cohdef.selectedCriteria = valueAccessor().selectedCriteria;
				expressionChangeSetup(element, cohdef);
			}
		};

		function primaryCritHeaderAdd(d3element, {
			cohdef
		} = {}) {
			if (!d3element.size())
				return;
			var headerHtml = `
									<div class="primary section-header row header-row">
										<div class="col-xs-12 header-content">
										</div>
									</div>
									<div class="paddedWrapper primary header row header-row">
										<div class="col-xs-12 header-content">
											<div class="msg"></div>
											<div class="row">
												<div class="col-xs-${12-NAME_COLS} col-xs-offset-${NAME_COLS}">
													<div class="cartoon">
													</div>
												</div>
											</div>
										</div>
									</div>`;
			d3element.html(headerHtml);
		}

		function primaryCritHeaderUpdate(d3element, {
			cohdef
		} = {}) {
			var pcList = getCrits(cohdef, "primary", "crit");
			var title = '<div class="heading">' + ko.unwrap(ko.i18n('components.expressionCartoonBindings.primaryCriteria', 'Primary Criteria')) + '</div>';
			var pLimitType = cohdef.PrimaryCriteria.PrimaryCriteriaLimit.Type;
			var pcPlural = pLimitType === 'All' ? ko.unwrap(ko.i18n('components.expressionCartoonBindings.s', 's')) : '';
			var oneOrAny = pLimitType === 'All' ? ko.unwrap(ko.i18n('components.expressionCartoonBindings.any', 'any')) : ko.unwrap(ko.i18n('components.expressionCartoonBindings.one', 'one'));
			var thoseOrthe = cohdef.ExpressionLimit.Type === 'All' ?
			ko.unwrap(ko.i18n('components.expressionCartoonBindings.those', 'those')) :
			ko.unwrap(ko.i18n('components.expressionCartoonBindings.the', 'the')) + ' ' + cohdef.ExpressionLimit.Type.toLowerCase();

			var pcCritMatch = pcList.length === 1 ?
			ko.unwrap(ko.i18n('components.expressionCartoonBindings.expressionCartoonBindingsText_1', 'the following primary criterion')) :
				ko.unwrap(ko.i18nformat('components.expressionCartoonBindings.expressionCartoonBindingsText_2', '<%=oneOrAny%> of the following <%=pcListLength%> primary criteria', {oneOrAny: oneOrAny, pcListLength: pcList.length}));
			var limitMsg = pLimitType === 'All' ?
				ko.unwrap(ko.i18nformat('components.expressionCartoonBindings.expressionCartoonBindingsText_3', 'Results will be generated for every person event matching <%=pcCritMatch%>. Final results will be limited to <%=thoseOrthe%> events matching any additional criteria and inclusion rules.', {pcCritMatch: pcCritMatch, thoseOrthe: thoseOrthe}))
				:
				ko.unwrap(ko.i18nformat('components.expressionCartoonBindings.expressionCartoonBindingsText_4', 'Results will be generated for the <%=pLimitTypeToLowerCase%> single event matching <%=pcCritMatch%>.', {pLimitTypeToLowerCase: pLimitType.toLowerCase(), pcCritMatch: pcCritMatch}))
				;

			var resultDateMsg = ko.unwrap(ko.i18nformat('components.expressionCartoonBindings.expressionCartoonBindingsText_5', 'Result index date<%=pcPlural%> will be the start date<%=pcPlural%> of the matching primary criteria event<%=pcPlural%>.', {pcPlural: pcPlural}));
			var rightHeader =
				/*
				`Duration from Start
							(<svg style="display:inline-block" height="10px" width="10px">
								<circle cx="5" cy="5" r="4" style="fill:green" />
							</svg>)` */
				`<svg height="0" class="x axis col-xs-12"><g transform="translate(0,20)" /></svg>`;

			d3element.select('div.section-header>div.header-content').html(title);
			d3element.select('div.msg').html(limitMsg + ' ' + resultDateMsg);
			d3element.select('div.cartoon').html(rightHeader);
			resetScales(cohdef);
			d3element.select('svg.x.axis>g').call(cohdef.obsAxis);
			d3element.select('svg.x.axis>g').selectAll("text");
		}

		function skeleton(selection, {
			cohdef,
			type
		} = {}) {
			// the reason this uses d3 append rather than composing html is to
			// send __data__ down to all the elements
			selection
				.classed(`${type}-row`, true)
			selection.append('div').attr('class', `indent-bar col-xs-${INDENT_COLS}`)
			var right = selection.append('div').attr('class', `after-indent col-xs-${12-INDENT_COLS}`)
			right = right.append('div').attr('class', 'row');
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
					.attr('height', 0)
			}
		}

		function skeletonUpdate(selection, {
			cohdef,
			type
		} = {}) {
			// every node that needs fresh data needs to be selected
			selection.select('div.indent-bar');
			selection.select('div.after-indent')
				.select('div.row')
				.select('div.name')
			selection.select('div.after-indent')
				.select('div.cartoon')
				.select('svg')
		}

		function critGroupHeaderAdd(d3element) {
			d3element.html(`
									 <div class="crit header row header-row">
										<div class="col-xs-12 header-content">
											<div class="row">
												<div class="axis-div col-xs-${12-NAME_COLS} col-xs-offset-${NAME_COLS}">
													<div class="cartoon">
														<svg height="0" class="x axis col-xs-12"><g transform="translate(0,20)" /></svg>
													</div>
												</div>
											</div>
										</div>
									 </div>
									 `);
		}

		function critGroupHeaderUpdate(d3element, {
			cohdef,
			critgroup
		} = {}) {
			var html = '';
			if (!critgroup) {
				html = ko.unwrap(ko.i18n('components.expressionCartoonBindings.noCriteriaGroup', 'No criteria group'));
			} else {
				var all_any = 
				ko.unwrap(ko.i18nformat('components.expressionCartoonBindings.expressionCartoonBindingsText_6', 'Restrict to people having events matching <%=critgroupTypeToLowerCase%> of the following criteria.', {critgroupTypeToLowerCase: critgroup.Type.toLowerCase()}));
				var rightHeaderMessage1 = ko.unwrap(ko.i18n('components.expressionCartoonBindings.expressionCartoonBindingsText_7', 'Events must start within bracketed period'));
				var rightHeaderMessage2 = ko.unwrap(ko.i18n('components.expressionCartoonBindings.expressionCartoonBindingsText_8', 'relative to index date. Lines and arrows represent required duration of these events.'));
				var rightHeader = `
						${rightHeaderMessage1}
						(<svg style="display:inline-block" height="10px" width="38px">
							<path class="curly-brace"
										d="${ makeCurlyBrace(
																			4,
																			0,
																			34,
																			0,
																			10,
																			0.6)}" />
						</svg>)
						${rightHeaderMessage2}
					`;

				html += `${all_any}${rightHeader}
								<div class="row">
									<div class="axis-div col-xs-${12-NAME_COLS} col-xs-offset-${NAME_COLS}">
										<div class="cartoon">
											<svg height="0" class="x axis col-xs-12"><g transform="translate(0,20)" /></svg>
										</div>
									</div>
								</div>`;
			}
			d3element.select('div.header-content').html(html);
			d3element.select('svg.x.axis>g').call(cohdef.obsAxis);
			d3element.select('svg.x.axis>g').selectAll("text");
		}

		function primaryCritBodyUpdate(d3element, {
			cohdef
		} = {}) {
			var pcList = getCrits(cohdef, "primary", "crit");
			groupBody(d3element, {
				cohdef,
				group: cohdef.PrimaryCriteria,
				critType: 'primary'
			});
		}

		function addCritSectBodyAdd(d3element, {
			cohdef,
			acsect
		}) {
			var headerHtml = `
									<div class="critgroup section-header row header-row paddedWrapper">
										<div class="col-xs-12 header-content">
										</div>
									</div>
									<div class="critgroup section-body paddedWrapper">
									</div>`;
			d3element.html(headerHtml);
		}

		function addCritSectBodyUpdate(d3element, {
			cohdef,
			acsect
		}) {
			var titleMessage = !acsect ? ko.unwrap(ko.i18n('components.expressionCartoonBindings.noAdditionalCriteria', 'No additional criteria')) : ko.unwrap(ko.i18n('components.expressionCartoonBindings.additionalCriteria', 'Additional Criteria')) 
			var title = `<div class="heading">${titleMessage}</div>`;
			d3element.select('div.header-content').html(title);
			if (!acsect) return;
			var body = d3element.select('div.section-body');

			d3AddIfNeeded(body, [acsect], 'div', ['critgroup', 'section', 'header', 'paddedWrapper'],
				critGroupHeaderAdd,
				critGroupHeaderUpdate, {
					cohdef,
					critgroup: acsect
				});
			d3AddIfNeeded(body, [acsect], 'div', ['critgroup', 'section', 'body', 'paddedWrapper'],
				null,
				critGroupBodyUpdate, {
					cohdef,
					critgroup: acsect
				});
		}

		function critGroupBodyUpdate(d3element, {
			cohdef,
			critgroup
		} = {}) {
			groupBody(d3element, {
				cohdef,
				group: critgroup,
				critType: 'group'
			});

			var groupNodes = d3AddIfNeeded(d3element, critgroup.Groups, 'div', ['crit', 'row', 'subgroup'],
				skeleton, skeletonUpdate, {
					cohdef,
					type: 'subgroup'
				})
			connectorText(groupNodes, critgroup);
			groupNodes.selectAll('div.subgroup-container')
				.each(function (group) {
					var subgroup = d3AddIfNeeded(d3.select(this), [group], 'div', ['critgroup', 'subgroup', 'header'],
						critGroupHeaderAdd,
						critGroupHeaderUpdate, {
							cohdef,
							critgroup: group
						});
					connectorText(subgroup, group, 'subgroup');
					d3AddIfNeeded(d3.select(this), [group], 'div', ['critgroup', 'subgroup', 'body'],
						null,
						critGroupBodyUpdate, {
							cohdef,
							critgroup: group
						});
				});
		}

		function connectorText(nodes, parentcrit, subgroup) {
			var groupMsg, groupConnector;
			if (parentcrit.PrimaryCriteriaLimit) {
				groupMsg = ko.unwrap(ko.i18nformat('components.expressionCartoonBindings.paramOf', '<%=param%> of', {param: parentcrit.PrimaryCriteriaLimit.Type}));
				groupConnector = ko.unwrap(ko.i18n('components.expressionCartoonBindings.or', 'or'));
			} else {
				groupMsg = 
				ko.unwrap(ko.i18nformat('components.expressionCartoonBindings.paramOf', '<%=param%> of', {param: parentcrit.Type[0] + parentcrit.Type.slice(1).toLowerCase()}));
				if (parentcrit.Type.match(/^AT/))
					groupMsg = 
					ko.unwrap(ko.i18nformat('components.expressionCartoonBindings.atParamOf', 'At <%=param%> of', {param: parentcrit.Type.slice(3).toLowerCase() + ' ' + parentcrit.Count}));
				groupConnector = parentcrit.Type === 'ALL' ? ko.unwrap(ko.i18n('components.expressionCartoonBindings.and', 'and')) : ko.unwrap(ko.i18n('components.expressionCartoonBindings.or', 'or'));
			}

			nodes.selectAll('div.indent-bar')
				.html(function (crit) {
					crit = getCrit("critorgroup", crit);
					if (!('_critIndex' in crit)) debugger;
					if (!crit._critIndex || subgroup) return groupMsg;
					d3.select(this).style('text-align', 'right');
					return groupConnector;
				});

		}

		function groupBody(d3element, {
			cohdef,
			group,
			critType
		} = {}) {
			var list = group.CriteriaList; //.map(getCrit("crit"));
			var critNodes = d3AddIfNeeded(d3element, list, 'div', ['crit', 'row'],
				skeleton, skeletonUpdate, {
					cohdef,
					type: 'crit'
				})
			connectorText(critNodes, group);
			critNodes.selectAll('div.name')
				.call(critName, cohdef, critType);

			critNodes.selectAll('div.cartoon > svg')
				.call(drawCrits, cohdef, critType);

			critNodes
				.on("mouseover", function (crit) {
					cohdef.selectedCriteria(crit);
					//cohdef.selectedCriteria(getCrit("wrapper",crit));
					var evt = d3.event;
					var tt = $('div#cartoon-tooltip > div#tooltip');

					const xTooltip = document.documentElement.clientWidth - 25 > evt.pageX + tt.width();
					const left = xTooltip ?
						evt.pageX - tt.parent().offset().left + 10 :
						evt.pageX - tt.parent().offset().left - tt.width() - 10;

					const yTooltip = document.documentElement.clientHeight - 25 > evt.pageY + tt.height();
					const top = yTooltip ?
						evt.pageY - tt.parent().offset().top + 10 :
						evt.pageY - tt.parent().offset().top - tt.height() - 10;

					tt.css('display', 'inline')
						.css('left', left)
						.css('top', top)
					//console.log(`client: ${evt.clientX},${evt.clientY}, parent: ${JSON.stringify(tt.parent().offset())}`);
				})
				.on("mouseout", function (crit) {
					var tt = $('div#cartoon-tooltip > div#tooltip');
					tt.css('display', 'none')
				})
		}
		/*var focusTip = d3tip()
											.attr('class', 'd3-tip')
											.offset([-10, 0])
											.html(function (d) {
												//return d3.select('#tooltip').html();
												return "howdy";
												return tipText(d);
											});*/
		function drawCrits(selection, cohdef, critType) {
			selection.each(function (_crit) {
				var el = d3.select(this); // the svg

				//el.on('mouseover', focusTip.show)
				//.on('mouseout', focusTip.hide)
				//el.call(focusTip);
				//var crit = critType === 'primary' ? _crit : _crit.Criteria;
				var crit = getCrit("crit", _crit);
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
					var circle = symbol({
						term: 'start',
						critType,
						inclusive: true,
						x: xIndex,
						y: yDot,
						r
					}, cohdef);
					html += circle;
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

		function inclusionRulesHeaderUpdate(d3element, {
			cohdef,
			rules
		} = {}) {
			var titleMessage = !rules.length ? ko.unwrap(ko.i18n('components.expressionCartoonBindings.noInclusionRules', 'No inclusion rules')) : ko.unwrap(ko.i18n('components.expressionCartoonBindings.inclusionRules', 'Inclusion rules')) 
			var html = `<div class="heading">${titleMessage}</div>`;
			var headerHtml = `
									<div class="critgroup section-header row header-row">
										<div class="col-xs-12 header-content">
											${html}
										</div>
									</div>
									<div class="critgroup section-body paddedWrapper">
									</div>`;
			d3element.html(headerHtml);
		}

		function inclusionRulesBodyAdd(d3element, {
			cohdef,
			rules
		} = {}) {
			d3element.append('div')
		}

		function inclusionRulesBodyUpdate(d3element, {
			cohdef,
			rules
		} = {}) {
			d3element
				.each(function (rule) {
					d3AddIfNeeded(this, [rule], 'div', ['critgroup', 'section', 'header'],
						inclusionRuleHeaderAdd,
						inclusionRuleHeaderUpdate, {
							cohdef,
							rule
						});
					d3AddIfNeeded(this, [rule], 'div', ['critgroup', 'section', 'body', 'paddedWrapper'],
						null,
						inclusionRuleBodyUpdate, {
							cohdef,
							rule
						});
				});
		}

		function inclusionRuleBodyUpdate(d3element, {
			cohdef,
			rule
		} = {}) {
			d3AddIfNeeded(d3element, [rule.expression], 'div', ['critgroup', 'section', 'header'],
				critGroupHeaderAdd,
				critGroupHeaderUpdate, {
					cohdef,
					critgroup: rule.expression
				});
			d3AddIfNeeded(d3element, [rule.expression], 'div', ['critgroup', 'section', 'body'],
				null,
				critGroupBodyUpdate, {
					cohdef,
					critgroup: rule.expression
				});
		}

		function inclusionRuleHeaderAdd(d3element) {
			d3element.html(`
										<div class="inclusion header row header-row">
											<div class="col-xs-12 header-content">
											</div>
										</div>
									 `);
		}

		function inclusionRuleHeaderUpdate(d3element, {
			cohdef,
			rule
		} = {}) {
			var html;
			if (rule.description) {
				html = `<div class="subheading">${rule.name} (${rule.description})</div>`;
			} else {
				html = `<div class="subheading">${rule.name}</div>`;
			}
			d3element.select('div.header-content').html(html);
		}

		function critName(selection, cohdef, critType) {
			selection.each(function (_crit) {
				var crit = getCrit("crit", _crit);
				var text = `${critLabel(crit, cohdef)}`;
				var verbose = `<span style="opacity:0.2">${critCartoonText(crit)}</span>`;
				if (critType === 'group')
					verbose += `<span style="opacity:0.2">
									${addCritOccurrenceText(_crit)}, ${addCritWindowText(_crit)}
									</span>`;
				//d3.select(this).html(text + verbose);
				d3.select(this).html(text);
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
			var html = '',
				y;
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
						html += interval('', '', {
							fixed: true,
							x1: durext[0],
							x2: durext[1],
							y: yLine,
							markerStart: 'stop',
							markerEnd: 'right',
							filled: filledArrow,
							term: 'dur'
						}, cohdef);
						html += interval('', '', {
							fixed: false,
							x1: durext[1],
							x2: cohdef.obsExt[1],
							y: yLine,
							markerEnd: 'right',
							filled: filledArrow,
							term: 'dur'
						}, cohdef);
						textCenter = (durext[0] + cohdef.obsExt[1]) / 2;
						break;
					case "l": // lt or lte
						html += interval('', '', {
							fixed: true,
							x1: durext[0],
							x2: durext[1],
							y: yLine,
							markerStart: 'stop',
							markerEnd: 'left',
							filled: filledArrow,
							term: 'dur'
						}, cohdef);
						textCenter = (durext[0] + durext[1]) / 2;
						break;
					case "e": // eq
						html += interval('', '', {
							fixed: true,
							x1: durext[0],
							x2: durext[1],
							y: yLine,
							markerStart: 'stop',
							markerEnd: 'stop',
							term: 'dur'
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
					html += interval('', '', {
						fixed: true,
						x1: durext[0],
						x2: durext[1],
						y: yLine,
						markerStart: 'stop',
						markerEnd: 'right',
						filled: filledArrow,
						term: 'dur'
					}, cohdef);
					html += interval('', '', {
						fixed: false,
						x1: durext[1],
						x2: durext[2],
						y: yLine,
						markerStart: 'right',
						markerEnd: 'left',
						filled: filledArrow,
						term: 'dur'
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
				var circle = symbol({
					term: 'start',
					critType,
					inclusive: startDateRange.Op.match(/e/),
					x: xIndex,
					y: yDot,
					r
				}, cohdef);
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
									>start ${dateText(startDateRange)}</text>`;
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
				var first = crit.First ? ' first ' : '';
				count += ` ${oc.IsDistinct ? 'distinct' : ''} ${first}
										occurrence${oc.Count===1 ? '' : 's'}`;
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

			var indexDot = symbol({
				term: 'start',
				inclusive: 'true',
				x: 0,
				y: dotY,
				r: dotR
			}, cohdef);
			var oc = addcrit.Occurrence;
			var howMany = `
				<text x="${braceMid}"
							y="${dotLabel}"
							class="addcrit-marker ${oc.Count === 0 ? 'zero' : ''}"
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
				${indexDot}
				${howMany}
				<path class="curly-brace ${swin.noStart ? 'indeterminate' : ''}"
							d="${ makeCurlyBrace(
																braceLeft,
																braceTop,
																braceRight,
																braceTop,
																braceHeight,
																0.6,
																braceMid,
																'left')}" />
				<path class="curly-brace ${swin.noEnd ? 'indeterminate' : ''}"
							d="${ makeCurlyBrace(
																braceLeft,
																braceTop,
																braceRight,
																braceTop,
																braceHeight,
																0.6,
																braceMid,
																'right')}" />
		`;
			return html;
		}

		function rangeInfo(range, feature) {
			if (!range)
				return;
			switch (feature) {
				case "max":
					return Math.max(range.prettyValue, range.prettyExtent);
					// need this? if (range.Op === "!bt") return; // no upper limit
				case "upper":
					//console.log(range.Extent(), range.Op(), range.Value());
					return typeof range.Extent === "undefined" ? range.prettyValue : range.prettyExtent;
					// Extent is high end for "bt"
				case "min": // not used
					if (range.Op === "!bt")
						return; // no lower limit
				case "lower":
				case "val":
					return range.prettyValue;
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
			crit = getCrit("crit", crit);
			var whichEnd;
			switch (feature) {
				case "dur":
					if ("EraLength" in crit) {
						return crit.EraLength;
					}
					switch (getCrit("domain", crit)) {
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
			if (getCrit("domain", crit) === 'ObservationPeriod')
				return crit['Period' + whichEnd];
			if (crit['Occurrence' + whichEnd])
				return crit['Occurrence' + whichEnd];
		}

		function niceDomain(domain) {
			switch (domain) {
				case "ConditionOccurrence":
					console.log(ko.unwrap(ko.i18n('components.expressionCartoonBindings.condition', 'condition')));
					return ko.unwrap(ko.i18n('components.expressionCartoonBindings.condition', 'condition'));
				case "DrugExposure":
					return ko.unwrap(ko.i18n('components.expressionCartoonBindings.drug', 'drug'));
				case "DrugEra":
					return ko.unwrap(ko.i18n('components.expressionCartoonBindings.drugEra', 'drug era'));
				case "ConditionEra":
					return ko.unwrap(ko.i18n('components.expressionCartoonBindings.conditionEra', 'condition era'));
				case "DoseEra":
					return ko.unwrap(ko.i18n('components.expressionCartoonBindings.doseEra', 'dose era'));
				case "ProcedureOccurrence":
					return ko.unwrap(ko.i18n('components.expressionCartoonBindings.procedure', 'procedure'));
				case "Observation":
					return ko.unwrap(ko.i18n('components.expressionCartoonBindings.observation', 'observation'));
				case "DeviceExposure":
					return ko.unwrap(ko.i18n('components.expressionCartoonBindings.device', 'device'));
				case "Measurement":
					return ko.unwrap(ko.i18n('components.expressionCartoonBindings.measurement', 'measurement'));
				case "Specimen":
					return ko.unwrap(ko.i18n('components.expressionCartoonBindings.specimen', 'specimen'));
				case "Death":
					return ko.unwrap(ko.i18n('components.expressionCartoonBindings.death', 'death'));
				case "ObservationPeriod":
					return ko.unwrap(ko.i18n('components.expressionCartoonBindings.observationPeriod', 'observation period'));
				case "VisitOccurrence":
					return ko.unwrap(ko.i18n('components.expressionCartoonBindings.visit', 'visit'));
				default:
					return domain;
			}
		}

		function conceptName(crit, cohdef) {
			return crit.CodesetId > -1 ?
				_.find(cohdef.ConceptSets, d=> d.id == crit.CodesetId).name : '';
		}

		function critLabel(crit, cohdef) {
			var dom = niceDomain(getCrit("domain", crit));
			var name = conceptName(crit, cohdef);
			if (name)
				return `${dom}: ${name}`;
			return ko.unwrap(ko.i18nformat('components.expressionCartoonBindings.anyParam', 'any <%=param%>', {param: dom}));
		}

		//returns path string d for <path d="This string">
		//a curly brace between x1,y1 and x2,y2, w pixels wide
		//and q factor, .5 is normal, higher q = more expressive bracket
		function makeCurlyBrace(x1, y1, x2, y2, w, q, pointx, halfOnly) {
			if (typeof pointx === "undefined") {
				return makeCurlyBraceHalf(x1, y1, x2, y2, w, q);
			}
			if (halfOnly)
				return makeCurlyBraceHalf(x1, y1, pointx + (pointx - x1), y2, w, q, halfOnly);

			return makeCurlyBraceHalf(x1, y1, pointx + (pointx - x1), y2, w, q, 'left') +
				makeCurlyBraceHalf(pointx - (x2 - pointx), y1, x2, y2, w, q, 'right');
		}

		function makeCurlyBraceHalf(x1, y1, x2, y2, w, q, half) {
			if (x1 === x2 && y1 === y2) {
				// just draw line at x1
				return ("M " + x1 + " " + y1 +
					" L " + x1 + " " + (y1 + w));

			}
			//Calculate unit vector
			var dx = x1 - x2;
			var dy = y1 - y2;
			var len = Math.sqrt(dx * dx + dy * dy);
			dx = dx / len;
			dy = dy / len;

			//Calculate Control Points of path,
			var qx1 = x1 + q * w * dy;
			var qy1 = y1 - q * w * dx;
			var qx2 = (x1 - .25 * len * dx) + (1 - q) * w * dy;
			var qy2 = (y1 - .25 * len * dy) - (1 - q) * w * dx;
			var tx1 = (x1 - .5 * len * dx) + w * dy;
			var ty1 = (y1 - .5 * len * dy) - w * dx;
			var qx3 = x2 + q * w * dy;
			var qy3 = y2 - q * w * dx;
			var qx4 = (x1 - .75 * len * dx) + (1 - q) * w * dy;
			var qy4 = (y1 - .75 * len * dy) - (1 - q) * w * dx;

			var left = "M " + x1 + " " + y1 +
				" Q " + qx1 + " " + qy1 + " " + qx2 + " " + qy2 +
				" T " + tx1 + " " + ty1;
			var right = " M " + x2 + " " + y2 +
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
			var distinctOrAll = oc.IsDistinct ? ko.unwrap(ko.i18n('components.expressionCartoonBindings.distinct', 'distinct')) : ko.unwrap(ko.i18n('components.expressionCartoonBindings.all', 'all'));
			return ko.unwrap(ko.i18nformat('components.expressionCartoonBindings.expressionCartoonBindingsText_9', 'with <%=type%> <%%=count> using <%=distinctOrAll%> occurrences', {type: ['exactly','at most','at least'][oc.Type], count: oc.Count, distinctOrAll: distinctOrAll}));
		}

		function addCritWindowText(ac) {
			var sw = ac.StartWindow;
			var beforeArAfterStart = sw.Start.Coeff===-1 ? ko.unwrap(ko.i18n('components.expressionCartoonBindings.before', 'before')) : ko.unwrap(ko.i18n('components.expressionCartoonBindings.after', 'after'));
			var beforeArAfterEnd = sw.End.Coeff===-1 ? ko.unwrap(ko.i18n('components.expressionCartoonBindings.before', 'before')) : ko.unwrap(ko.i18n('components.expressionCartoonBindings.after', 'after'));
			return ko.unwrap(ko.i18nformat('components.expressionCartoonBindings.expressionCartoonBindingsText_10', 'occurring between <%=startDays%> days <%=beforeArAfterStart%> and <%=endDays%> days <%=beforeArAfterEnd%> index', {startDays: sw.Start.Days, endDays: sw.End.Days, beforeArAfterStart: beforeArAfterStart, beforeArAfterEnd: beforeArAfterEnd}));
		}

		function durType(crit) {
			if ("EraLength" in crit) {
				return ko.unwrap(ko.i18n('components.expressionCartoonBindings.era', 'Era'));
			}
			switch (getCrit("domain", crit)) {
				case "DrugExposure":
					return ko.unwrap(ko.i18n('components.expressionCartoonBindings.daysSupply', 'Days supply'));
				case "ObservationPeriod":
				case "VisitOccurrence":
					return ko.unwrap(ko.i18n('components.expressionCartoonBindings.visitCapital', 'Visit'));
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

		function dateText(range) {
			if (rangeInfo(range, 'single-double') === 'single') {
				return `${rangeInfo(range,'nice-op')} ${range.Value}`;
			} else {
				return `${rangeInfo(range,'nice-op')} ${rangeInfo(range, 'lower')}
										and ${rangeInfo(range, 'upper')}`;
			}
		}

		function critCartoonText(crit) {
			var dur = durText(crit);
			var startRange = getRange(crit, 'start');
			var start = 'any time';
			if (startRange) {
				start = dateText(startRange);
				//`${rangeInfo(startRange, 'nice-op')} ${rangeInfo(startRange, 'val')}`;
			}

			var endRange = getRange(crit, 'end');
			var end = 'any time';
			if (endRange) {
				end = dateText(endRange);
				//`${rangeInfo(endRange, 'nice-op')} ${rangeInfo(endRange, 'val')}`;
			}

			return `start ${start}, end ${end}, ${dur}`;
		}
	});

/*
function language(crit, feature, context) {
	switch(feature) {
		case: "First":
			if (crit.First) {
				switch (context) {
					case "printfriendly":
						return "for the first ${domain} in the person's history";
					case "cartoon":
						return "1st";
					case: "UI":
						return UIFirst;
				}
			}
	}
}

var language k
*/
