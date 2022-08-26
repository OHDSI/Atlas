define([
    'knockout',
    'text!./chartVenn.html',
    'components/Component',
    'utils/CommonUtils',
    'd3',
    'venn',
    'less!./venn.less'
], function(
    ko,
    view,
    Component,
    commonUtils,
    d3,
    venn
){

    class Venn extends Component {

        constructor(params){
            super(params);
            this.firstConceptSet = params.firstConceptSet();
            this.secondConceptSet = params.secondConceptSet();
            this.data = params.data();
            this.conceptInBothConceptSets = [];
            this.conceptInFirstConceptSetOnly = [];
            this.conceptInSecondConceptSetOnly = [];
            this.sets = ko.computed(() => {
                this.data.forEach(concept => {
                    if (concept.conceptIn1Only === 1) {
                        this.conceptInFirstConceptSetOnly.push(concept.conceptName);
                    }
                    if (concept.conceptIn2Only === 1) {
                        this.conceptInSecondConceptSetOnly.push(concept.conceptName);
                    }
                    if (concept.conceptIn1And2 === 1) {
                        this.conceptInBothConceptSets.push(concept.conceptName);
                    }
                });
                const conceptSets = [
                    {sets: [this.firstConceptSet], size: this.conceptInFirstConceptSetOnly.length + this.conceptInBothConceptSets.length, tooltipText: this.conceptInFirstConceptSetOnly},
                    {sets: [this.secondConceptSet], size:this.conceptInSecondConceptSetOnly.length + this.conceptInBothConceptSets.length, tooltipText: this.conceptInSecondConceptSetOnly},
                ];
                if (this.conceptInBothConceptSets.length > 0) {
                    conceptSets.push({
                        sets: [this.firstConceptSet, this.secondConceptSet],
                        size: this.conceptInBothConceptSets.length,
                        label: `${this.conceptInBothConceptSets.length} common concept${this.conceptInBothConceptSets.length === 1 ? '' : 's'}`,
                        tooltipText: this.conceptInBothConceptSets
                    });
                }
                return conceptSets;
            });

            var chart = venn.VennDiagram();
            chart.wrap(false)
                .width(640)
                .height(640);

            const showText = ['hidden', 'hidden', 'visible'];
            const colors = ['#1f77b4','#17becf'];
            var div = d3.select("#venn").datum(this.sets()).call(chart);
            div.selectAll("text").style("font-size", '14px').style('visibility', function(d,i) { return showText[i]; });

            div.selectAll("path")
                .style("stroke-opacity", 0)
                .style("stroke", "#fff")
                .style("stroke-width", 3)
                .style("fill", function(d,i) { return colors[i]; });
            // add a tooltip
            var tooltip = d3.select("body").append("div")
                .attr("class", "venntooltip");

            // add a legend
            var svg = d3.select("#legend").style('width', '100%');

            // legend
            // Add one dot in the legend for each name.
            var keys = [this.sets()[0].sets[0], this.sets()[1].sets[0]];
            var colorColor = d3.scaleOrdinal()
                .domain(keys)
                .range(colors);

            svg.selectAll("mydots")
                .data(keys)
                .enter()
                .append("circle")
                .attr("cx", 10)
                .attr("cy", function(d,i){ return 100 + i*25}) // 100 is where the first dot appears. 25 is the distance between dots
                .attr("r", 7)
                .style("fill", function(d){ return colorColor(d)})

            // Add one dot in the legend for each name.
            svg.selectAll("mylabels")
                .data(keys)
                .enter()
                .append('text')
                .attr("x", 30)
                .attr("y", function(d,i){ return 100 + i*25}) // 100 is where the first dot appears. 25 is the distance between dots
                .style("fill", function(d){ return colorColor(d)})
                .text(function(d){ return d})
                .attr("text-anchor", "left")
                .style("alignment-baseline", "middle")
                .style("font-size", "18px")

            // add listeners to all the groups to display tooltip on mouseover
            div.selectAll("g")
                .on("mouseover", function(d, i) {
                    // sort all the areas relative to the current item
                    venn.sortAreas(div, d);
                    tooltip.transition().duration(400).style("opacity", 0.9).style("visibility", 'visible');
                    const html = d.tooltipText.map(concept => `<div>- ${concept}</div>`);
                    const title = `<div class="title">${d.label ? 'Common concepts' : `${d.sets[0]} concepts`}</div>`;
                    const amount = `<div class="title">Amount: ${d.size}</div>`;
                    const textHtml = `${title}${amount}${html.join('')}`;
                    tooltip.html(textHtml);
                    var selection = d3.select(this).transition("tooltip").duration(400);
                    selection.select("text").style("font-size", '16px');
                    selection.select("path")
                        .style("stroke-width", 3)
                        .style("fill-opacity", d.sets.length == 1 ? .6 : .4)
                        .style("stroke-opacity", 1);
                })

                .on("mousemove", function() {
                    tooltip.style("left", (d3.event.pageX + 40) + "px")
                        .style("top", (d3.event.pageY - 40) + "px");
                })

                .on("mouseout", function(d, i) {
                    tooltip.transition().duration(400).style('opacity', 0).style("visibility", 'hidden');
                    var selection = d3.select(this).transition("tooltip").duration(400);
                    selection.select("text").style("font-size", '14px');
                    selection.select("path")
                        .style("stroke-width", 0)
                        .style("fill-opacity", d.sets.length == 1 ? .25 : .0)
                        .style("stroke-opacity", 0);
                });
        }

    }

    return commonUtils.build('venn-diagram', Venn, view);
});