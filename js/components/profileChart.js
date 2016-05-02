"use strict";
define(['knockout','d3', 'lodash'], function (ko, d3, _) {
  window.d3 = d3;
  var width = 400;
  var height = 450;
  var lineHeight = 20;

  ko.bindingHandlers.profileChart = {
    init: function (element, valueAccessor, allBindingsAccessor) {
      //var profile = valueAccessor().profile;
      //var filteredData = valueAccessor().filteredData;
    },
    update: function (element, valueAccessor, allBindingsAccessor) {
      var va = valueAccessor();
      if (va.filteredData() && va.profile())
        plotScatter(element, va.filteredData(), va.profile(), va.cohortPerson());
      //console.log(va.profile());
      //debugger;
    }
  };
});
function plotScatter(element, records, profile, cohortPerson) {
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
  var height = recordTypes.length * 35 - margin.top - margin.bottom;
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
      .attr('class', 'observation-period');
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
  focus.selectAll("line")
    //.data([member.startDate, member.endDate])
    .data([cohortPerson.startDate, cohortPerson.endDate])
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
  context.selectAll("line")
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
