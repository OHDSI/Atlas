"use strict";
define(['knockout','d3'], function (ko, d3) {
  window.d3 = d3;
  var width = 300;
  var height = 150;

  ko.bindingHandlers.cartoonExpression = {
    init: function (element, valueAccessor, allBindingsAccessor) {
      var expression = valueAccessor()[0];
      var selectedFragment = valueAccessor()[1];
      var svg = d3.select(element).append('svg');
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
    },
    update: function (element, valueAccessor, allBindingsAccessor) {
      var expression = valueAccessor()[0];
      var selectedFragment = valueAccessor()[1];
      console.log(selectedFragment());
      var svg = d3.select(element).select('svg');
      //svg.select('g.primary').remove();
      svg.selectAll('g').remove();
      var g =svg.append('g')
                .attr('class','primary')
                .attr('transform', 
                      'translate(' + (width/2) + ',10)')
              .on('mouseover', function() {
                d3.select("#primary-criteria")
                  .style('background-color', 'pink')
                d3.select('#cartoon-primary-criteria')
                  .style('fill', 'pink')
              })
              .on('mouseout', function() {
                d3.select("#primary-criteria")
                  .style('background-color', null)
                d3.select('#cartoon-primary-criteria')
                  .style('fill', 'white')
              })

      g.append('rect')
          .attr('width', width)
          .attr('height', 50)
          .attr('x', -150)
          .attr('y', -25)
          .style('fill','white')
          .style('opacity',.3)
          .attr('id', 'cartoon-primary-criteria')
      g.append('line')
          .attr('x1', -50)
          .attr('x2', 100)
          .attr('y1', 0)
          .attr('y2', 0)
          .attr('stroke-width', 4)
          .attr('fill', 'pink')
          .attr('stroke', 'blue')
          .style('marker-start', 'url(#left-arrow)')
          .style('marker-end', 'url(#right-arrow)')
      g.append('circle')
          .attr('r', 8)
          .attr('cx', 0)
          .attr('cy', 0)
          .style('fill','brown')
          .style('stroke','black')

      var criteriaGroup = expression().AdditionalCriteria();
      var domain = {
        min: -expression().PrimaryCriteria().ObservationWindow.PriorDays(), 
        max: expression().PrimaryCriteria().ObservationWindow.PostDays()
      };
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
                    .range([-width/2, width/2]);
      drawCartoon(g, criteriaGroup, 2, scale, selectedFragment)
    }
  };
  function criteriaGroupWalk(criteriaGroup, cb) {
    var list = criteriaGroup.CriteriaList();
    for (var i = 0; i < list.length; i++) {
      cb(list[i]);
    }
    var groups = criteriaGroup.Groups();
    for (var i = 0; i < groups.length; i++) {
      criteriaGroupWalk(groups[i], cb);
    }
  }
  function drawCartoon(selection, data, linesdown, scale, selectedFragment) {
      //console.log("cartoon update", ko.toJS(valueAccessor), ko.toJS(allBindingsAccessor));
      console.log("draw", linesdown);
      var morelines = 0;
      var g = selection
              .append('g')
                .attr('class','additional')
                .attr('transform', 'translate(0,' + 
                      (linesdown*10) +')')
      g.selectAll('g.additional')
              .data(data.CriteriaList())
                .enter()
              .append('line')
                .attr('x1', function(cg) {
                  return cg.StartWindow.Start.Days() *
                         cg.StartWindow.Start.Coeff();
                })
                .attr('x2', function(cg) {
                  return cg.StartWindow.End.Days() *
                         cg.StartWindow.End.Coeff();
                })
                .attr('y1', function(d,i) { return i*10;})
                .attr('y2', function(d,i) { return i*10;})
                .attr('stroke-width', 4)
                //.attr('stroke', 'blue')
                .attr('stroke', function(d) {
                  return d === selectedFragment() ?
                      'red' : 'blue';
                })
                .on('mouseover', function(d) {
                  selectedFragment(d);
                })
      console.log(g[0]);
      var groups = data.Groups();
      for (var i = 0; i < groups.length; i++) {
        console.log('subgroup');
        drawCartoon(g, groups[i], data.CriteriaList().length, scale, selectedFragment);
      }
  }
});
