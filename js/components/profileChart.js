"use strict";
define(['knockout','d3', 'lodash'], function (ko, d3, _) {
  window.d3 = d3;
  var width = 400;
  var height = 450;
  var lineHeight = 20;

  var x = d=>{
    if (!d) debugger;
    return d.startDate;
  };
  var y = d=>d.recordType;
  var tipText = d=>d.conceptName;
  var pointClass = d=>d.recordType;
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
        .classed(pointClass(datum), true);
    //g.selectAll('path.' + pointClass(datum))
      //.attr('r', radius(datum))
      //.attr('fill', 'blue');
  }
  ko.bindingHandlers.profileChart = {
    init: function (element, valueAccessor, allBindingsAccessor) {
      //var profile = valueAccessor().profile;
      //var filteredData = valueAccessor().filteredData;
    },
    update: function (element, valueAccessor, allBindingsAccessor) {
      var va = valueAccessor();
      if (va.filteredData() && va.profile())
        categoryScatterPlot(element, va.filteredData(), 
                            x, y, tipText, pointClass, triangle,
                           null, va.allData());
                    // va.profile(), va.cohortPerson());
      //console.log(va.profile());
      //debugger;
    }
  };
});
function categoryScatterPlot(element, points, x, y, tipText, 
                             pointClass,
                             pointFunc,
                             verticalLines, allPoints, highlighPoints ) {
  /* verticleLines: [{xpos, color},...] */
  var categories = _.chain(points).map(y).uniq().value();
  var catLineHeight = 28;
  var mainHeight = categories.length * 28;
  var margin = {
      top: 10,
      right: 10,
      bottom: 30,
      left: 10
    };
  //var height = recordTypes.length * 35 - margin.top - margin.bottom;
  var brushWindowHeight = 50;
  var margin2 = {
      top: 10,
      right: 10,
      bottom: 20,
      left: 10
    },
    width = 900 - margin.left - margin.right;

  var xScale = d3.time.scale().range([0, width]),
    x2Scale = d3.time.scale().range([0, width]),
    yScale = d3.scale.ordinal().rangePoints([mainHeight * .9, mainHeight * .1]),
    y2Scale = d3.scale.ordinal().rangePoints([brushWindowHeight * .9, brushWindowHeight * .1]);

  //xScale.domain([profile.startDate, profile.endDate]);
  //xScale.domain(d3.extent(points.map(x)));
  xScale.domain(d3.extent(allPoints.map(x)));
  yScale.domain(categories);
  //x2Scale.domain(xScale.domain());
  x2Scale.domain(d3.extent(allPoints.map(x)));
  y2Scale.domain(yScale.domain());

  //$('#scatter').empty();
  $(element).empty();

  var svg = d3.select(element).append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", mainHeight + margin.top + margin.bottom +
                    brushWindowHeight + margin2.top + margin2.bottom);

  var focus = svg.append("g")
    //.attr("class", "focus")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  var context = svg.append("g")
    .attr("class", "context")
    .attr("transform", "translate(" + margin2.left + "," + 
          (mainHeight + margin.top + margin.bottom + margin2.top) + ")");

  var xAxis = d3.svg.axis().scale(xScale).orient("bottom"),
    xAxis2 = d3.svg.axis().scale(x2Scale).orient("bottom"),
    yAxis = d3.svg.axis().scale(yScale).orient("left");

  var brushed = function () {
    xScale.domain(brush.empty() ? x2Scale.domain() : brush.extent());
    focus.selectAll('g.point')
      .attr("transform", function(d) {
        return "translate(" + xScale(x(d)) + "," + yScale(y(d)) + ")";
      })
    //var member = self.members()[self.currentMemberIndex];
    focus.selectAll("line")  // not drawing vertLines right now
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
    .x(x2Scale)
    .on("brush", brushed);

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
    .attr("transform", function(d) {
      return "translate(" + xScale(x(d)) + "," + yScale(y(d)) + ")";
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
          .attr('y', yScale(category) - 5)
  });

  context.selectAll("rect")
    .data(allPoints)
    .enter()
    .append("rect")
    .attr('x', function (d) {
      return x2Scale(x(d));
    })
    .attr('y', function (d) {
      return y2Scale(y(d));
    })
    .attr('width', 2)
    .attr('height', 2)
    .attr('class', function (d) {
      return pointClass(d);
    })
    .classed('dim', function(d) {
      return !_.find(points, d);
    })


  focus.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + mainHeight + ")")
    .call(xAxis);

  context.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + brushWindowHeight + ")")
    .call(xAxis2);

  context.append("g")
    .attr("class", "x brush")
    .call(brush)
    .selectAll("rect")
    .attr("y", -6)
    .attr("height", brushWindowHeight + 7);
}
function profileChart(element, records, profile, cohortPerson) {
  var recordTypes = _.chain(records)
                      .pluck('recordType')
                      .uniq()
                      .value();
  var margin = {
      top: 10,
      right: 10,
      bottom: 30,
      left: 10
    };
  //var height = recordTypes.length * 35 - margin.top - margin.bottom;
  var height = recordTypes.length * 28;
  var height2 = 50;
  var margin2 = {
      top: 10,
      right: 10,
      bottom: 20,
      left: 10
    },
    width = 900 - margin.left - margin.right;

  var x = d3.time.scale().range([0, width]),
    x2 = d3.time.scale().range([0, width]),
    y = d3.scale.ordinal().rangePoints([height * .9, height * .1]),
    y2 = d3.scale.ordinal().rangePoints([height2 * .9, height2 * .1]);

  x.domain([profile.startDate, profile.endDate]);
  y.domain(recordTypes);
  x2.domain(x.domain());
  y2.domain(y.domain());

  //$('#scatter').empty();
  $(element).empty();

  var svg = d3.select(element).append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom +
                    height2 + margin2.top + margin2.bottom);

  var focus = svg.append("g")
    //.attr("class", "focus")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  var context = svg.append("g")
    .attr("class", "context")
    .attr("transform", "translate(" + margin2.left + "," + 
          (height + margin.top + margin.bottom + margin2.top) + ")");

  var xAxis = d3.svg.axis().scale(x).orient("bottom"),
    xAxis2 = d3.svg.axis().scale(x2).orient("bottom"),
    yAxis = d3.svg.axis().scale(y).orient("left");

  var brushed = function () {
    x.domain(brush.empty() ? x2.domain() : brush.extent());
    focus.selectAll('rect')
      .attr('x', function (d) {
        return x(d.startDate) - 2.5;
      });
    //var member = self.members()[self.currentMemberIndex];
    focus.selectAll("line")
      .attr('x1', function (d) {
        return x(d)
      })
      .attr('y1', 0)
      .attr('x2', function (d) {
        return x(d)
      })
      .attr('y2', height)
    focus.select(".x.axis").call(xAxis);
  }

  var brush = d3.svg.brush()
    .x(x2)
    .on("brush", brushed);

  var focusTip = d3.tip()
    .attr('class', 'd3-tip')
    .offset([-10, 0])
    .html(function (d) {
      return d.conceptName;
    });

  svg.call(focusTip);

  // plot observation window lines
  //var member = self.members()[self.currentMemberIndex];
  focus.selectAll("line.observation-period")
    .data([profile.startDate, profile.endDate])
    //.data([cohortPerson.startDate, cohortPerson.endDate])
    .enter()
    .append("line")
    .attr('x1', function (d) {
      return x(d)
    })
    .attr('y1', 0)
    .attr('x2', function (d) {
      return x(d)
    })
    .attr('y2', height)
    .attr('class', 'observation-period');

  // plot index date
  focus.selectAll("line.index-date")
    .data([cohortPerson.startDate])
    .enter()
    .append("line")
    .attr('x1', function (d) {
      return x(d)
    })
    .attr('y1', 0)
    .attr('x2', function (d) {
      return x(d)
    })
    .attr('y2', height)
    .attr('class', 'index-date');

  // place your data into the focus area
  focus.selectAll("rect")
    .data(records)
    .enter()
    .append("rect")
    .attr('x', function (d) {
      return x(d.startDate) - 2.5;
    })
    .attr('y', function (d) {
      return y(d.recordType);
    })
    .attr('width', 5)
    .attr('height', 5)
    .attr('class', function (d) {
      return d.recordType;
    })
    .on('mouseover', function (d) {
      focusTip.show(d);
    })
    .on('mouseout', function (d) {
      focusTip.hide(d);
    });

  recordTypes.forEach(function(recordType) {
    focus.append("text")
          .text(recordType)
          .attr('class', recordType)
          .attr('x', 0)
          .attr('y', y(recordType) - 5)
  });

  // and focus area
  context.selectAll("line.observation-period")
    //.data([member.startDate, member.endDate])
    .data([profile.startDate, profile.endDate])
    .enter()
    .append("line")
    .attr('x1', function (d) {
      return x2(d)
    })
    .attr('y1', 0)
    .attr('x2', function (d) {
      return x2(d)
    })
    .attr('y2', height2)
    .attr('class', 'observation-period');
  context.selectAll("line.index-date")
    .data([cohortPerson.startDate])
    .enter()
    .append("line")
    .attr('x1', function (d) {
      return x2(d)
    })
    .attr('y1', 0)
    .attr('x2', function (d) {
      return x2(d)
    })
    .attr('y2', height2)
    .attr('class', 'index-date');

  context.selectAll("rect")
    .data(records)
    .enter()
    .append("rect")
    .attr('x', function (d) {
      return x2(d.startDate);
    })
    .attr('y', function (d) {
      return y2(d.recordType);
    })
    .attr('width', 2)
    .attr('height', 2)
    .attr('class', function (d) {
      return d.recordType;
    });


  focus.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis);

  context.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height2 + ")")
    .call(xAxis2);

  context.append("g")
    .attr("class", "x brush")
    .call(brush)
    .selectAll("rect")
    .attr("y", -6)
    .attr("height", height2 + 7);
}
