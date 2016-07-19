"use strict";
define(['knockout','d3', 'lodash', 'D3-Labeler/labeler'], function (ko, d3, _) {

	var margin = {
			top: 0,
			right: 0,
			bottom: 30,
			left: 0
		};
	var vizHeight = 240;
	var width = 900;
	//var width = minWidth - margin.left - margin.right;

	var xScale = d3.scale.linear();
	function relativeXscale(x) {
		return xScale(x) - xScale(0);
	}
	var yScale = d3.scale.ordinal();
	var x = d=>{
		if (!d) debugger;
		//return d.startDate;
		return d.startDay;
	};
	// these are hardcoded now, but should be parameters to make this chart more reusable
	var endX = d => d.endDay;
	var y = d=>d.domain;
	var tipText = d=>d.conceptName;
	var pointClass = d=>d.domain;
	var radius = d=>2;

	var highlightFunc = ()=>{};
	var highlightFunc2 = ()=>{};
	var focusTip = d3.tip()
		.attr('class', 'd3-tip')
		.offset([-10, 0])
		.html(function (d) {
			return tipText(d);
		});

	ko.bindingHandlers.profileChart = {
		init: function (element, valueAccessor, allBindingsAccessor) {
			valueAccessor().highlightRecs.subscribe(recs=> {
				highlightFunc(recs);
				highlightFunc2(recs);
			});
		},
		update: function (element, valueAccessor, allBindingsAccessor) {
			//width = Math.max(minWidth, element.offsetWidth - margin.left - margin.right);
			var va = valueAccessor();
			width = element.offsetWidth;
			vizHeight = (window.innerHeight - 150) / (va.short ? 2 : 1) - margin.top - margin.bottom;
			va.aspectRatio((vizHeight + margin.top + margin.bottom) / width);

			if (width < 100)
				return;
			var svg = categoryScatterPlot(element, va.recs(), 
													rectangle,
												 null, va.zoomFilter);
			if (va.allRecs.length != va.recs().length)
				inset(svg, va.allRecs, va.recs(), va.zoomFilter);
		}
	};
	function categoryScatterPlot(element, points, 
															pointFunc,
															verticalLines, 
															zoomFilter
															) {
		/* verticleLines: [{xpos, color},...] */

		if (zoomFilter()) {
			xScale.domain(zoomFilter());
		} else {
			xScale.domain([d3.min(points.map(x)) - 1, d3.max(points.map(endX)) + 1]);
		}

		var categories = _.chain(points).map(y).uniq().value();
		yScale.domain(categories.sort())
					.rangeRoundBands([margin.top, vizHeight + margin.top], .04);

		$(element).empty();

		var svg = d3.select(element).append("svg")
			.attr("preserveAspectRatio", "xMinYMin meet")
			.attr("viewBox", `0 0 ${width + margin.left + margin.right} ${vizHeight + margin.top + margin.bottom}`)
			//.attr("width", width)
			//.attr("height", vizHeight + margin.top + margin.bottom);
		xScale.range([0, width]);

		var focus = svg.append("g")
			//.attr("class", "focus")
			.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

		var xAxis = d3.svg.axis().scale(xScale).orient("bottom");

		var brushed = function () {
			/*
			//xScale.domain(brush.empty() ? x2Scale.domain() : brush.extent());
			focus.selectAll('g.point')
				.attr("transform", function(d,i) {
					return "translate(" + (xScale(x(d)) + jitter(i).x) + "," + 
																(yScale(y(d)) + jitter(i).y) +")";
				})
			//var member = self.members()[self.currentMemberIndex];
			focus.selectAll("line.index")	// not drawing vertLines right now
				.attr('x1', function (d) {
					return xScale(d)
				})
				.attr('y1', margin.top)
				.attr('x2', function (d) {
					return xScale(d)
				})
				.attr('y2', vizHeight)
			focus.select(".x.axis").call(xAxis);
			*/
		}

		var brush = d3.svg.brush()
			.x(xScale)
			.on("brush", brushed)
			.on("brushend", function() {
				focusTip.hide();
				if (brush.empty()) {
					zoomFilter(null);
				} else {
					zoomFilter(brush.extent());
				}
			});

		svg.call(focusTip);

		var letterSpacingScale = d3.scale.log()
					.domain([.8,20])
					.range([-.05, 2]);
		var fontSizeScale = d3.scale.pow(1/2)
					.domain([10, vizHeight])
					.range([15, 75]);
		focus.selectAll('rect.category')
					.data(categories)
					.enter()
					.append('rect')
					.attr('class','category')
					.attr('width', width)
					.attr('height', yScale.rangeBand())
					.attr('y', d => yScale(d))
		focus.selectAll('text.category')
					.data(categories)
					.enter()
					.append('text')
					.attr('class','category')
					.attr('font-size', fontSizeScale(yScale.rangeBand()))
					.attr('y', d => yScale(d) + yScale.rangeBand() / 2 + fontSizeScale(yScale.rangeBand()) / 2)
					.attr('x', width/2)
					.attr('text-anchor', 'middle')
					.style('letter-spacing', 0)
					.text(d=>d)
					.style('letter-spacing', function(d) {
						var ratio = width / this.getBBox().width;
						var ls = letterSpacingScale(ratio);
						return ls + 'em';
					});

		focus.append("g")
			.attr("class", "x brush")
			.call(brush)
			.selectAll("rect")
			.attr("y", margin.top)
			.attr("height", vizHeight);

		var pointGs = focus.selectAll("g.point")
			.data(points);
		pointGs.exit().remove();
		pointGs
			.enter()
			.append("g")
				.classed('point', true);
		focus.selectAll("g.point")
			.attr("transform", function(d,i) {
				return "translate(" + (xScale(x(d)) + jitter(i).x) + "," + 
															(yScale(y(d)) + jitter(i).y) +")";
			})
			.attr('class', function (d) {
				return pointClass(d);
			})
			.classed('point', true)
			.on('mouseover', focusTip.show)
			.on('mouseout', focusTip.hide)
			/*
			// these stubs don't do anything useful yet but
			// are here to allow fetching detailed data on
			// prolonged hover over profile point issue #143
			.on('mouseenter', function(d) {
				$(this).data('timeout', setTimeout(()=>{
					$(this).data(null);
				}, 500));
			})
			.on('mouseleave', function() {
				let timeout = $(this).data('timeout');
				if (timeout)
					clearTimeout(timeout);
			})
			*/
			.each(pointFunc)

		pointGs.on('mousedown', function(){ // http://wrobstory.github.io/2013/11/D3-brush-and-tooltip.html
			var brush_elm = svg.select(".brush").node();
			var new_click_event = new Event('mousedown');
			new_click_event.pageX = d3.event.pageX;
			new_click_event.clientX = d3.event.clientX;
			new_click_event.pageY = d3.event.pageY;
			new_click_event.clientY = d3.event.clientY;
			brush_elm.dispatchEvent(new_click_event);
		});

		if (points.length <= 50) {
			// labeler usage from https://github.com/tinker10/D3-Labeler demo
			var label_array = points.map((d,i)=>{
				d.x = xScale(x(d)) + jitter(i).x;
				d.y = yScale(y(d)) + jitter(i).y;
				d.r = 8;
				return {
					x: d.x,
					y: d.y,
					name: tipText(d),
					width: 0, height: 0,
					rec: d,
				};
			});
			var labels = focus.selectAll('.labels')
						 						.data(label_array)
						 						.enter()
						 						.append('text')
						 						.attr('class','label')
						 						.attr('text-anchor','start')
						 						.text(d=>d.name)
						 						.attr('x', d=>d.x)
						 						.attr('y', d=>d.y)
						 						.attr('fill','black');
			var index=0;
			labels.each(function() {
				label_array[index].width = this.getBBox().width;
				label_array[index].height = this.getBBox().height;
				index += 1;
			});
			var links = focus.selectAll('.link')
							 					.data(label_array)
							 					.enter()
							 					.append('line')
							 					.attr('class','link')
							 					.attr('x1', d=>d.x)
							 					.attr('y1', d=>d.y)
							 					.attr('x2', d=>d.x)
							 					.attr('y2', d=>d.y)
			var sim_ann = d3.labeler()
											.label(label_array)
											.anchor(points)
											.width(width)
											.height(vizHeight)
											.start(2000)
			labels.transition().duration(0)
													.attr('x', d=>d.x)
													.attr('y', d=>d.y)
			links.transition().duration(0)
													.attr('x2', d=>d.x)
													.attr('y2', d=>d.y)
		}

		focus.append("g")
					.attr("class", "x axis")
					.attr("transform", "translate(0," + (vizHeight + margin.top) + ")")
					.call(xAxis);

		highlightFunc = function(recs) {
			if (recs.length === 0) {
				pointGs.classed('highlighted', false);
				pointGs.classed('unhighlighted', false);
				labels && labels.classed('highlighted', false);
				labels && labels.classed('unhighlighted', false);
				links && links.classed('highlighted', false);
				links && links.classed('unhighlighted', false);
			} else {
				pointGs.classed('highlighted', d => _.find(recs,d));
				pointGs.classed('unhighlighted', d => !_.find(recs,d));
				labels && labels.classed('highlighted', d => _.find(recs,d.rec));
				labels && labels.classed('unhighlighted', d => !_.find(recs,d.rec));
				links && links.classed('highlighted', d => _.find(recs,d.rec));
				links && links.classed('unhighlighted', d => !_.find(recs,d.rec));
			}
		};
		return svg;
	}
	function inset(svg, allPoints, filteredPoints, zoomFilter) {
		var insetWidth = (width + margin.left + margin.right) * .15
		var insetHeight = (vizHeight + margin.top + margin.bottom) * .15;
		var ixScale = d3.scale.linear()
										.range([5,insetWidth - 5])
										.domain([d3.min(allPoints.map(x)), d3.max(allPoints.map(endX))]);
		var categories = _.chain(allPoints).map(y).uniq().value();
		var iyScale = d3.scale.ordinal().rangePoints([insetHeight * .1, insetHeight * .9 ])
																		.domain(categories.sort());
		var g = svg.append("g")
								.attr("class", "inset")
								.attr("transform",`translate(${width - insetWidth}, 0)`)
		g.append("rect")
			.attr('class', 'background')
			.attr('width', insetWidth)
			.attr('height', insetHeight);
		var points = g.selectAll("rect.inset-point")
										.data(allPoints);
		points.exit().remove();
		points
					.enter()
					.append("rect")
						.attr('class', 'inset-point')
		g.selectAll("rect.inset-point")
			.attr("x", (d,i) => ixScale(x(d)))
			.attr("y", (d,i) => iyScale(y(d)))
			.attr('width', 1.5)
			.attr('height', 1.5)
			.classed('filteredout', d => {
				//return allPoints.length != filteredPoints.length && !_.find(filteredPoints, d)
				return !_.find(filteredPoints, d)
			});
		highlightFunc2 = function(recs) {
			points.classed('highlighted', d => _.find(recs,d))
						.attr('transform', d => _.find(recs,d) ? 'translate(-1,-1)' : null)
		}
		if (zoomFilter()) {
			var zoomDays = zoomFilter()[1] - zoomFilter()[0];
			var edges = [{x: ixScale(zoomFilter()[0]), 
										width: ixScale(zoomDays) - ixScale(0)}];

			var insetZoom = g
												.selectAll('rect.insetZoom')
												.data(edges)
												.enter()
	 											.append('rect')
	 											.attr('class', 'insetZoom')
												.attr('x', d=>d.x)
												.attr('width', d=>d.width)
												.attr('y', 0)
												.attr('height', insetHeight)
			var drag = d3.behavior.drag();
			insetZoom.call(drag);
			drag.on('drag', function(d) {
				d.x += d3.event.dx;
				insetZoom.attr('x', d.x)
				//.style('cursor', '-webkit-grabbing') doesn't work
			});
			drag.on('dragend', function(d) {
				var x = ixScale.invert(d.x);
				//insetZoom.style('cursor', '-webkit-grab')
				zoomFilter([x, x + zoomDays]);
			});

			var resizeLeft = g
												.selectAll('rect.resizeLeft')
												.data(edges)
												.enter()
												.append('rect')
												.attr('class', 'resizeLeft')
												.attr('x', d=>d.x - 3)
												.attr('width', 6)
												.attr('y', 5)
												.attr('height', insetHeight)
			var resizeLeftDrag = d3.behavior.drag();
			resizeLeft.call(resizeLeftDrag);
			resizeLeftDrag.on('drag', function(d) {
				d.x += d3.event.dx;
				d.width -= d3.event.dx;
				resizeLeft.attr('x', d.x - 3)
				insetZoom.attr('x', d.x)
				 					.attr('width', d.width)
			});
			resizeLeftDrag.on('dragend', function(d) {
				var x = ixScale.invert(d.x);
				//insetZoom.style('cursor', '-webkit-grab')
				zoomFilter([x, zoomFilter()[1]]);
			});

			var resizeRight = g
													.selectAll('rect.resizeRight')
													.data(edges)
													.enter()
													.append('rect')
														.attr('class', 'resizeRight')
														.attr('x', d=>d.x + d.width - 3)
														.attr('width', 6)
														.attr('y', 5)
														.attr('height', insetHeight)
			var resizeRightDrag = d3.behavior.drag();
			resizeRight.call(resizeRightDrag);
			resizeRightDrag.on('drag', function(d) {
				d.width += d3.event.dx;
				resizeRight.attr('x', d.x + d.width - 3)
				insetZoom.attr('width', d.width)
			});
			resizeRightDrag.on('dragend', function(d) {
				var width = ixScale.invert(d.width) - ixScale.invert(0);
				zoomFilter([zoomFilter()[0], zoomFilter()[0] + width]);
			});
		}
	}
	function circle(datum) {
		var g = d3.select(this);
		g.selectAll('circle.' + pointClass(datum))
			.data([datum])
			.enter()
			.append('circle')
			.classed(pointClass(datum), true);
		g.selectAll('circle.' + pointClass(datum))
			.attr('r', radius(datum))
	}
	function rectangle(datum) {
		var minBoxPix = 4;
		var g = d3.select(this);
		g.selectAll('rect.point.' + pointClass(datum))
			.data([datum])
			.enter()
			.append('rect')
			.classed('point', true)
			.classed(pointClass(datum), true);
		g.selectAll('rect.point.' + pointClass(datum))
			.attr('height', minBoxPix)
			.attr('width', function(d) {
				var days = Math.max(d.endDay-d.startDay, 1);
				var length = Math.max(minBoxPix, relativeXscale(days));
				if (isNaN(length)) debugger;
					return length;
			})
			.attr('x', -minBoxPix / 2)
			.attr('y', -minBoxPix / 2)
	}
	function triangle(datum) {
		var g = d3.select(this);
		g.selectAll('path.' + pointClass(datum))
			.data([datum])
			.enter()
			.append('path')
			.attr('d', 'M 0 -3 L -3 3 L 3 3 Z')
			.attr('transform', 'scale(2)')
			.classed(pointClass(datum), true);
	}
	function pointyLine(datum) {
		// draw base of triangles at 0
		var tb = 6, th = 6; // triangle base, height
		var g = d3.select(this);
		g.selectAll('path.' + pointClass(datum))
			.data([datum])
			.enter()
			.append('path')
			.attr('d', function(d) {
				var length = relativeXscale(d.endDay-d.startDay);
				if (isNaN(length)) debugger;
				var path = [];
				path.push(`m ${tb/2} 0`);			 // right corner, left triangle
				path.push(`l -${tb} 0`);				// left corner, left triangle
				path.push(`l ${tb/2} -${th}`);	// top corner, left triangle
				path.push(`l ${tb/2} ${th}`);	 // right corner, left triangle
				if (length > tb) {
					path.push(`l ${length} 0`);		 // right corner, right triangle
					path.push(`l -${tb/2} -${th}`); // top corner, right triangle
					path.push(`l -${tb/2} ${th}`);	// left corner, right triangle
					path.push(`l 0 -2`);						// line thickness
					path.push(`l -${length - tb} 0 Z`);	 
				} else {
				}
				return path.join(' ');
				//'m 0 -3 l -3 6 l 6 0 Z M 4 -3 L 0 3 L 7 3 Z'
			})
			.classed(pointClass(datum), true);
	}
	var jitterOffsets = []; // keep them stable as points move around
	var jitterYScale = d3.scale.linear().domain([-.5,.5]);
	function jitter(i, maxX=6, maxY=12) {
		jitterYScale.range([yScale.rangeBand() * .1, yScale.rangeBand() * .9]);
		jitterOffsets[i] = jitterOffsets[i] || [Math.random() - .5, Math.random() - .5];
		return { x: jitterOffsets[i][0] * maxX, y: jitterYScale(jitterOffsets[i][1]) };
	}
});
