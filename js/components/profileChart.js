"use strict";
define(['knockout','d3', 'lodash'], function (ko, d3, _) {

  var catLineHeight = 38;
  var margin = {
      top: 10,
      right: 10,
      bottom: 30,
      left: 10
    };
  //var height = domain.length * 35 - margin.top - margin.bottom;
  var width = 900 - margin.left - margin.right;

  var xScale = d3.scale.linear().range([0, width]);
  function relativeXscale(x) {
    return xScale(x) - xScale(0);
  }
  var x = d=>{
    if (!d) debugger;
    //return d.startDate;
    return d.startDay;
  };
  var endX = d => d.endDay;
  var y = d=>d.domain;
  var tipText = d=>d.conceptName;
  var pointClass = d=>d.domain;
  var radius = d=>2;
  function circle(datum) {
    var g = d3.select(this);
    g.selectAll('circle.' + pointClass(datum))
      .data([datum])
      .enter()
      .append('circle')
        .classed(pointClass(datum), true);
    g.selectAll('circle.' + pointClass(datum))
      .attr('r', radius(datum))
      //.attr('fill', 'blue');
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
          path.push(`m ${tb/2} 0`);       // right corner, left triangle
          path.push(`l -${tb} 0`);        // left corner, left triangle
          path.push(`l ${tb/2} -${th}`);  // top corner, left triangle
          path.push(`l ${tb/2} ${th}`);   // right corner, left triangle
          if (length > tb) {
            path.push(`l ${length} 0`);     // right corner, right triangle
            path.push(`l -${tb/2} -${th}`); // top corner, right triangle
            path.push(`l -${tb/2} ${th}`);  // left corner, right triangle
            path.push(`l 0 -2`);            // line thickness
            path.push(`l -${length - tb} 0 Z`);   
          } else {
          }
          return path.join(' ');
              //'m 0 -3 l -3 6 l 6 0 Z M 4 -3 L 0 3 L 7 3 Z'
        })
        .classed(pointClass(datum), true);
  }
  var jitterOffsets = []; // keep them stable as points move around
  function jitter(i, maxX=6, maxY=12) {
    jitterOffsets[i] = jitterOffsets[i] || 
      { x: (Math.random() - .5) * maxX, y: (Math.random() - .5) * maxY };
    return jitterOffsets[i];
  }
  ko.bindingHandlers.profileChart = {
    init: function (element, valueAccessor, allBindingsAccessor) {
    },
    update: function (element, valueAccessor, allBindingsAccessor) {
      var va = valueAccessor();
      categoryScatterPlot(element, va.recs(), 
                            x, y, tipText, pointClass, pointyLine, //triangle,
                           null, null, va.filteredIn, jitter, va.ownFilter);
    }
  };
  function categoryScatterPlot(element, points, x, y, tipText, 
                              pointClass,
                              pointFunc,
                              verticalLines, highlighPoints,
                              filteredIn, jitter,
			      holdBrushExtent) {
    /* verticleLines: [{xpos, color},...] */
    var categories = _.chain(points).map(y).uniq().value();
    var mainHeight = categories.length * catLineHeight;
    var yScale = d3.scale.ordinal().rangePoints([mainHeight * .9, mainHeight * .1]);

    xScale.domain([d3.min(points.map(x)), d3.max(points.map(endX))]);
    yScale.domain(categories.sort().reverse());

    $(element).empty();

    var svg = d3.select(element).append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", mainHeight + margin.top + margin.bottom);

    var focus = svg.append("g")
      //.attr("class", "focus")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var xAxis = d3.svg.axis().scale(xScale).orient("bottom"),
      yAxis = d3.svg.axis().scale(yScale).orient("left");

    var brushed = function () {
      //xScale.domain(brush.empty() ? x2Scale.domain() : brush.extent());
      focus.selectAll('g.point')
        .attr("transform", function(d,i) {
          return "translate(" + (xScale(x(d)) + jitter(i).x) + "," + 
                                (yScale(y(d)) + jitter(i).y) +")";
        })
      //var member = self.members()[self.currentMemberIndex];
      focus.selectAll("line.index")  // not drawing vertLines right now
        .attr('x1', function (d) {
          return xScale(d)
        })
        .attr('y1', 0)
        .attr('x2', function (d) {
          return xScale(d)
        })
        .attr('y2', mainHeight)
      focus.select(".x.axis").call(xAxis);
    }

    var brush = d3.svg.brush()
      .x(xScale)
      .on("brush", brushed)
      .on("brushend", function() {
        if (brush.empty()) {
	  console.log(`empty brush setting filteredIn to ${points.length} points`);
          filteredIn(points);
        } else {
          var inRecs = points.filter(function(d) {
            return x(d) >= brush.extent()[0] && x(d) <= brush.extent()[1];
          });
	  console.log(`brush ${brush.extent().join(',')} setting filteredIn to ${inRecs.length} points`);
          filteredIn(inRecs);
        }
	holdBrushExtent(brush.extent());
      });

    var focusTip = d3.tip()
      .attr('class', 'd3-tip')
      .offset([-10, 0])
      .html(function (d) {
        return tipText(d);
      });

    svg.call(focusTip);

    // place your data into the focus area
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
      .on('mouseover', function (d) {
        focusTip.show(d);
      })
      .on('mouseout', function (d) {
        focusTip.hide(d);
      })
      .each(pointFunc);

    categories.forEach(function(category) {
      focus.append("text")
            .text(category)
            .attr('class', category)
            .attr('x', 0)
            .attr('y', yScale(category) - 13)
    });

    focus.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + mainHeight + ")")
      .call(xAxis);

    focus.append("g")
      .attr("class", "x brush")
      .call(brush)
      .selectAll("rect")
      .attr("y", -6)
      .attr("height", mainHeight + 7);
    if (holdBrushExtent()) {
      brush.extent(holdBrushExtent());
      brush.event(focus.select('g.x.brush'));
    }
  }
});
