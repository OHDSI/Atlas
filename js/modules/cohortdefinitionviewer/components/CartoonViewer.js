define(['knockout', 'cohortbuilder/options', 'text!./CartoonViewerTemplate.html', 'd3', 'css!./styles/cartoon.css'], 
			 function (ko, options, template, d3) {
		
	function CartoonEditorViewModel(params) {
		var self = this;

		self.expression = params.expression;
		self.options = options;

    self.cartoonHeight = 150;
    self.cartoonWidth = 300;

    var g = d3.select('#cartoonsvg')
            .append('g')
              .attr('transform', 
                    'translate(' + (self.cartoonWidth/2) + ',10)')
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

    g.append('rect')
        .attr('width', 300)
        .attr('height', 50)
        .attr('x', -150)
        .attr('y', -25)
        .style('fill','white')
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


		self.getLimitTypeText = function(typeId)
		{
			return options.resultLimitOptions.filter(function (item) {
				return item.id == typeId;
			})[0].name;
		}
		self.getCriteriaIndexComponent = function (data) {
			data = ko.utils.unwrapObservable(data);
			if (data.hasOwnProperty("ConditionOccurrence"))
				return "condition-occurrence-criteria-viewer";
			else if (data.hasOwnProperty("ConditionEra"))
				return "condition-era-criteria-viewer";
			else if (data.hasOwnProperty("DrugExposure"))
				return "drug-exposure-criteria-viewer";
			else if (data.hasOwnProperty("DrugEra"))
				return "drug-era-criteria-viewer";
			else if (data.hasOwnProperty("DoseEra"))
				return "dose-era-criteria-viewer";
			else if (data.hasOwnProperty("ProcedureOccurrence"))
				return "procedure-occurrence-criteria-viewer";
			else if (data.hasOwnProperty("Observation"))
				return "observation-criteria-viewer";			
			else if (data.hasOwnProperty("VisitOccurrence"))
				return "visit-occurrence-criteria-viewer";			
			else if (data.hasOwnProperty("DeviceExposure"))
				return "device-exposure-criteria-viewer";			
			else if (data.hasOwnProperty("Measurement"))
				return "measurement-criteria-viewer";
			else if (data.hasOwnProperty("Specimen"))
				return "specimen-criteria-viewer";
			else if (data.hasOwnProperty("ObservationPeriod"))
				return "observation-period-criteria-viewer";			
			else if (data.hasOwnProperty("Death"))
				return "death-criteria-viewer";			
			else
				return "unknownCriteriaType";
		};
	}

	// return factory
	return {
		viewModel: CartoonEditorViewModel,
		template: template
	};
});
