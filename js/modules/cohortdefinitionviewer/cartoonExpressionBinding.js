"use strict";
define(['knockout','d3'], function (ko, d3) {
  window.d3 = d3;
  var width = 300;
  var height = 150;
  var lineHeight = 14;

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
                    .range([0.05 * width, 0.9 * width]);

      var svg = d3.select(element).select('svg');
      //svg.select('g.primary').remove();
      svg.selectAll('g').remove();
      var g =svg.append('g')
                .attr('class','primary')
                .attr('transform', 
                      'translate(0,' + lineHeight + ')')
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
          .attr('x1', scale(-expression().PrimaryCriteria()
                        .ObservationWindow.PriorDays())) 
          .attr('x2', scale(expression().PrimaryCriteria()
                        .ObservationWindow.PostDays()))
          .attr('y1', 0)
          .attr('y2', 0)
          .attr('stroke-width', 4)
          .attr('fill', 'pink')
          .attr('stroke', 'blue')
          .style('marker-start', 'url(#left-arrow)')
          .style('marker-end', 'url(#right-arrow)')
      g.append('circle')
          .attr('r', 8)
          .attr('cx', scale(0))
          .attr('cy', 0)
          .style('fill','brown')
          .style('stroke','black')

      drawCartoon(g, criteriaGroup, 2, scale, selectedFragment, primaryWindow)
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
  function drawCartoon(selection, data, linesdown, scale, selectedFragment, primaryWindow) {
      var morelines = 0;
      var g = selection
              .append('g')
                .attr('class','additional')
                .attr('transform', 'translate(0,' + 
                      (linesdown*lineHeight) +')')
      g.selectAll('g.additional')
              .data(data.CriteriaList())
                .enter()
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
                .classed('highlighted', function(d) {
                  return d === selectedFragment();
                })
                //.attr('stroke', 'blue')
                //.attr('stroke', function(d) {
                  //return d === selectedFragment() ?  'red' : 'blue';
                //})
                .on('mouseover', function(d) {
                  selectedFragment(d);
                })
      var groups = data.Groups();
      for (var i = 0; i < groups.length; i++) {
        drawCartoon(g, groups[i], data.CriteriaList().length, scale, selectedFragment, primaryWindow);
      }
  }
});
