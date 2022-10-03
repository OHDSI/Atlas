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
            this.updateOutsideFilters = params.updateOutsideFilters;
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
                    {sets: ['1'], size: this.conceptInFirstConceptSetOnly.length + this.conceptInBothConceptSets.length, tooltipText: this.conceptInFirstConceptSetOnly, amountOnly:this.conceptInFirstConceptSetOnly.length, name: this.firstConceptSet, key: '1 Only' },
                    {sets: ['2'], size:this.conceptInSecondConceptSetOnly.length + this.conceptInBothConceptSets.length, tooltipText: this.conceptInSecondConceptSetOnly,amountOnly:this.conceptInSecondConceptSetOnly.length, name: this.secondConceptSet, key: '2 Only'},
                ];
                if (this.conceptInBothConceptSets.length > 0) {
                    conceptSets.push({
                        sets: ['1','2'],
                        size: this.conceptInBothConceptSets.length,
                        label: `${this.conceptInBothConceptSets.length} common concept${this.conceptInBothConceptSets.length === 1 ? '' : 's'}`,
                        tooltipText: this.conceptInBothConceptSets,
                        key: 'Both'
                    });
                }
                return conceptSets;
            });

            var chart = venn.VennDiagram();
            chart.wrap(false)
                 .height(450)

            // const showText = ['visible', 'visible', 'visible'];
            //     .style('visibility', function(d,i) { return showText[i]; })
            const textY = [0,0,30];
            const colors = ['#1f77b4','#17becf'];
            var div = d3.select("#venn").datum(this.sets()).call(chart);
            div.selectAll("text").attr("y", function(d,i) { return textY[i] + (+d3.select(this).attr("y")); }).style("font-size", '12px').style("fill", function(d,i) { return colors[i]; });

            div.selectAll("path")
                .style("stroke-opacity", 0)
                .style("stroke", "#fff")
                .style("stroke-width", 3)
                .style("cursor",'pointer')
                .style("fill", function(d,i) { return colors[i]; })
                .attr("class", function(d,i) { return d.key; });
            // add a tooltip
            var tooltip = d3.select("body").append("div")
                .attr("class", "venntooltip");

            // add listeners to all the groups to display tooltip on mouseover
            div.selectAll("g")
                .on("click", function(d,i) {
                    params.updateOutsideFilters(d.key);
                })

                .on("mouseover", function(d, i) {
                    // sort all the areas relative to the current item
                    venn.sortAreas(div, d);
                    tooltip.transition().duration(400).style("opacity", 0.9).style("visibility", 'visible');
                    const title = `<div class="title">${d.label ? 'Common concepts' : `${d.name} concept set`}</div>`;
                    const amount =  d.label ? `<div class="title">The amount: ${d.size}</div>` : `<div class="title">The total amount of concepts: ${d.size}</div>`;
                    const concepts = d.label ? `<div></div>` : `<div class="title">The concepts are  only in this concept set: ${d.amountOnly}</div>`;
                    const textHtml = `${title}${amount}${concepts}`;
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

            // // add a legend
            // var svg = d3.select("#legend").style('width', '100%');
            // // legend
            // // Add one dot in the legend for each name.
            // var keys = [this.sets()[0].sets[0], this.sets()[1].sets[0]];
            // var colorColor = d3.scaleOrdinal()
            //     .domain(keys)
            //     .range(colors);
            //
            // svg.selectAll("mydots")
            //     .data(keys)
            //     .enter()
            //     .append("circle")
            //     .attr("cx", 10)
            //     .attr("cy", function(d,i){ return 100 + i*25}) // 100 is where the first dot appears. 25 is the distance between dots
            //     .attr("r", 7)
            //     .style("fill", function(d){ return colorColor(d)})
            //
            // // Add one dot in the legend for each name.
            // svg.selectAll("mylabels")
            //     .data(keys)
            //     .enter()
            //     .append('text')
            //     .attr("x", 30)
            //     .attr("y", function(d,i){ return 100 + i*25}) // 100 is where the first dot appears. 25 is the distance between dots
            //     .style("fill", function(d){ return colorColor(d)})
            //     .text(function(d){ return d})
            //     .attr("text-anchor", "left")
            //     .style("alignment-baseline", "middle")
            //     .style("font-size", "18px")
        }

    }

    return commonUtils.build('venn-diagram', Venn, view);
});