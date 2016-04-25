"use strict";
define(['knockout','d3'], function (ko, d3) {
  window.d3 = d3;
  var width = 300;
  var height = 150;

	ko.bindingHandlers.cartoonExpression = {
		init: function (element, valueAccessor, allBindingsAccessor) {
      d3.select(element)
        .append('svg')
      console.log("cartoon init");
      d3.select('#primary-criteria')
        .on('mouseover', function() {
          d3.select('#cartoon-primary-criteria')
            .style('fill', 'pink')
          d3.select("#primary-criteria")
            .style('background-color', 'pink')
        })
        .on('mouseout', function() {
          d3.select('#cartoon-primary-criteria')
            .style('fill', 'white')
          d3.select("#primary-criteria")
            .style('background-color', null)
        })
		},
		update: function (element, valueAccessor, allBindingsAccessor) {
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
      g.append('circle')
          .attr('r', 8)
          .attr('cx', 0)
          .attr('cy', 0)
          .style('fill','brown')
          .style('stroke','black')

      var criteriaGroup = valueAccessor()().AdditionalCriteria();
      drawCartoon(g, criteriaGroup, 1)
		}
	};
  function drawCartoon(selection, data, linesdown) {
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
                .attr('x1', -100)
                .attr('x2', 0)
                .attr('y1', function(d,i) { return i*10;})
                .attr('y2', function(d,i) { return i*10;})
                .attr('stroke-width', 4)
                .attr('stroke', 'blue')
      console.log(g[0]);
      var groups = data.Groups();
      for (var i = 0; i < groups.length; i++) {
        console.log('subgroup');
        drawCartoon(g, groups[i], data.CriteriaList().length);
      }
  }
});
