"use strict";
define(['knockout','d3'], function (ko, d3) {
	window.d3 = d3;
	var width = 400;
	var height = 450;
	var lineHeight = 20;

	ko.bindingHandlers.cartoonExpression = {
		init: function (element, valueAccessor, allBindingsAccessor) {
			var expression = valueAccessor()[0];
			var selectedFragment = valueAccessor()[1];
			/*
			var svg = d3.select(element).append('svg')
										.attr('width',width)
										.attr('height',height)
			svg.append('marker')
					.attr('id', 'right-arrow')
					.attr('viewBox', '0 0 10 10')
					.attr('refX', 0)
					.attr('refY', 5)
					.attr('markerUnits', 'strokeWidth')
					.attr('markerWidth', 4)
					.attr('markerHeight', 3)
					.attr('orient', 'auto')
					.append('path')
						.attr('d', 'M 0 0 L 10 5 L 0 10 z')
			svg.append('marker')
					.attr('id', 'left-arrow')
					.attr('viewBox', '0 0 10 10')
					.attr('refX', 10)
					.attr('refY', 5)
					.attr('markerUnits', 'strokeWidth')
					.attr('markerWidth', 4)
					.attr('markerHeight', 3)
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
			*/
		},
		update: function (element, valueAccessor, allBindingsAccessor) {
			var expression = valueAccessor()[0];
			var selectedFragment = valueAccessor()[1];

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
			criteriaGroupWalk(criteriaGroup, getEndPoints);
			var scale = d3.scale.linear()
										.domain([domain.min, domain.max])
										.range([0.10 * width, 0.85 * width]);


			var primaryCriteria = _.chain(expression().PrimaryCriteria().CriteriaList())
															.map(_.pairs)
															.flatten()
															.map(d=>{
																	var [domain, pc] = d;
																	pc.domain = domain;
																	return pc;
																})
															.value();
			var maxDur = _.chain(primaryCriteria)
										.map(getMaxDuration)
										.max()
										.value();
			console.log(maxDur);
			function rangeInfo(range, feature) {
				if (!range) 
					return;
				switch (feature) {
					case "max":
						if (range.Op() === "!bt")
							return; // no upper limit
					case "upper":
						console.log(range.Extent(), range.Op(), range.Value());
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
				pcDiv.append('div')
							.attr('class', 'pclabel')
							.text(critLabel);
				var cartoonDiv = pcDiv.append('div')
							.attr('class', 'pc-cartoon')
							.html(pcCartoonText)
				cartoonDiv.append('svg')
										.attr('height', 30)
										.attr('width', 300)
										.call(pcCartoon)
			});
			function pcCartoon(selection) {
				selection.append('line')
							.attr('y1', 15)
							.attr('y2', 15)
							.attr('x2', 300)
							.attr('stroke-dasharray', '5,5')

				selection.filter(pc=>getRange(pc, 'start'))
						.each(function(pc) {
							var startRange = getRange(pc, 'start');
							if (startRange) {
								if (['gt','gte','!bt'].indexOf(startRange.Op()) > -1) {
									d3.select(this).append('text')
												.attr('y', 28)
												.text(startRange.Value());
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

				return `start ${start}, ${dur}`;
			}

			return;
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
								.attr('transform', 
											'translate(0,' + lineHeight + ')')

			g.append('rect')
					.attr('width', width * 0.9)
					.attr('height', lineHeight * 2)
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
	function drawCartoon(selection, data, linesdown, scale, selectedFragment, primaryWindow) {
			var morelines = 0;
			var g = selection
							.append('g')
								.attr('class','additional')
								.attr('transform', 'translate(0,' + 
											(linesdown*lineHeight) +')')
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
			g.selectAll('g.additional')
				.append('text')
					//.attr('x', -20)
					.attr('y', function(d,i) { return lineHeight * (0.26+i); })
					.attr('x', 5)
					.text(function(d) { 
						return d.key;
					})
			var groups = data ? data.Groups() : [];
			for (var i = 0; i < groups.length; i++) {
				drawCartoon(g, groups[i], data.CriteriaList().length + 2*i, scale, selectedFragment, primaryWindow);
			}
	}
});
