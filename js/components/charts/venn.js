define([
    'knockout',
    'text!./chartVenn.html',
    'components/Component',
    'utils/CommonUtils',
    'utils/ChartUtils',
    'd3',
    'venn',
    'less!./venn.less'
], function(
    ko,
    view,
    Component,
    commonUtils,
    ChartUtils,
    d3,
    venn
){

    class Venn extends Component {

        constructor(params,container){
            super(params);
            this.firstConceptSet = params.firstConceptSet();
            this.secondConceptSet = params.secondConceptSet();
            this.data = params.data();
            this.container = container;
            this.chartName = ko.computed(() => {

                return `${this.firstConceptSet}_${this.secondConceptSet}_venn`.replaceAll(' ', '_')
            });
            this.conceptInBothConceptSets = [];
            this.conceptInFirstConceptSetOnly = [];
            this.conceptInSecondConceptSetOnly = [];
            this.selectOutsideConceptSet = params.lastSelectedMatchFilter.extend({notify: 'always'});
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

                let lengthFirstConceptSets = this.conceptInFirstConceptSetOnly.length + this.conceptInBothConceptSets.length;
                let lengthSecondConceptSets = this.conceptInSecondConceptSetOnly.length + this.conceptInBothConceptSets.length;
                let lengthBothConceptSets = this.conceptInBothConceptSets.length;
                const maxDifference = 999;

                if (lengthFirstConceptSets/lengthSecondConceptSets > maxDifference) {
                    const difference = Math.round(lengthFirstConceptSets/lengthSecondConceptSets);
                    const sameLength = lengthSecondConceptSets === lengthBothConceptSets;
                    lengthBothConceptSets = sameLength ? lengthBothConceptSets*Math.round(difference/100) : lengthBothConceptSets + lengthBothConceptSets * Math.round(difference/100);
                    lengthSecondConceptSets *= Math.round(difference/100);
                }
                if (lengthSecondConceptSets/lengthFirstConceptSets > maxDifference) {
                    const difference = Math.round(lengthSecondConceptSets/lengthFirstConceptSets);
                    const sameLength = lengthFirstConceptSets === lengthBothConceptSets;
                    lengthBothConceptSets = sameLength ? lengthBothConceptSets * Math.round(difference/100) : lengthBothConceptSets + lengthBothConceptSets * Math.round(difference/100);
                    lengthFirstConceptSets *= Math.round(difference/100);
                }

                const conceptSets = [
                    {sets: ['CS1'], size: lengthFirstConceptSets, tooltipText: this.conceptInFirstConceptSetOnly, amountOnly:this.conceptInFirstConceptSetOnly.length, count: this.conceptInFirstConceptSetOnly.length + this.conceptInBothConceptSets.length, name: this.firstConceptSet, key: '1 Only' },
                    {sets: ['CS2'], size: lengthSecondConceptSets, tooltipText: this.conceptInSecondConceptSetOnly,amountOnly:this.conceptInSecondConceptSetOnly.length,count: this.conceptInSecondConceptSetOnly.length + this.conceptInBothConceptSets.length, name: this.secondConceptSet, key: '2 Only'},
                ];
                if (this.conceptInBothConceptSets.length > 0) {
                    conceptSets.push({
                        sets: ['CS1','CS2'],
                        size: lengthBothConceptSets,
                        count: this.conceptInBothConceptSets.length,
                        amountOnly: this.conceptInBothConceptSets.length,
                        label: `${this.conceptInBothConceptSets.length} common concept${this.conceptInBothConceptSets.length === 1 ? '' : 's'}`,
                        tooltipText: this.conceptInBothConceptSets,
                        key: 'Both'
                    });
                }
                return conceptSets.sort((a,b) => b.size - a.size);
            });

            let chart = venn.VennDiagram();
            chart.wrap(false)
                 .height(450);

            const textY = [0,0,30];
            const colors = ['#1f77b4','#17becf', '#d62728'];
            const defaultColors = ['#d9edf7','#bdf9ff','#f2dede'];
            let div = d3.select("#venn").datum(this.sets()).call(chart);
            div.selectAll("text").attr("y", function(d,i) { return textY[i] + (+d3.select(this).attr("y")); }).style("font-size", '12px').style("fill", 'black').style('visibility', function(d) { return d.amountOnly ? 'visible' : 'hidden'});

            div.selectAll("path")
                .style("stroke", function(d,i) { return colors[i]; })
                .style("stroke-width", 2)
                .style("cursor",'pointer')
                .style("fill-opacity", 1)
                .style("fill", function(d,i) {return  defaultColors[i]; })
                .attr("class", function(d,i) { return d.key; })
                .attr("color", function(d,i) {return  colors[i]; })
                .attr("defaultColor", function(d,i) {return  defaultColors[i]; });

            // calculate new circles coordinates
            const circlesPath = [];
            div.selectAll("path").each(function (d) { circlesPath.push(d3.select(this).attr('d'))});
            const rightCircleEqual = !this.sets()[1].amountOnly;
            const newCirclePathes =  this.calculateCoordinate(circlesPath,rightCircleEqual);
            div.selectAll("path").attr('d',(d,i) => newCirclePathes[i]);

            // add a tooltip
            let tooltip = d3.select("body").append("div")
                .attr("class", "venntooltip");

            // add listeners to all the groups to display tooltip on mouseover
            div.selectAll("g")
                .on("click", function(d) {
                    params.updateOutsideFilters(d.key);
                })

                .on("mouseover", function(d) {
                    // sort all the areas relative to the current item
                    venn.sortAreas(div, d);
                    tooltip.transition().duration(400).style("opacity", 0.9).style("visibility", 'visible');
                    const title = `<div class="title">${d.label ? ko.i18n('cs.browser.compare.vennDiagramCommonConcepts', 'Common concepts')() : ko.i18nformat('cs.browser.compare.vennDiagramNameConceptSet', '<%=name%> concept set', {name: d.name})()}</div>`;
                    const amount =  d.label ? `<div class="title">${ko.i18nformat('cs.browser.compare.vennDiagramAmountConcepts', 'The amount: <%=count%>', {count: d.count})()}</div>` : `<div class="title">${ko.i18nformat('cs.browser.compare.vennDiagramTotalAmountConcepts', 'The total amount of concepts: <%=count%>', {count: d.count})()}</div>`;
                    const concepts = d.label ? `<div></div>` : `<div class="title">${ko.i18nformat('cs.browser.compare.vennDiagramAmountOnly', 'The concepts are only in this concept set: <%=amountOnly%>', {amountOnly: d.amountOnly})()}</div>`;
                    const textHtml = `${title}${amount}${concepts}`;
                    tooltip.html(textHtml);
                    let selection = d3.select(this).transition("tooltip").duration(400);
                    selection.select("text").style("font-size", '16px');
                    selection.select("path")
                        .style("stroke-width", 3);
                })

                .on("mousemove", function() {
                    tooltip.style("left", (d3.event.pageX + 40) + "px")
                        .style("top", (d3.event.pageY - 40) + "px");
                })

                .on("mouseout", function() {
                    tooltip.transition().duration(400).style('opacity', 0).style("visibility", 'hidden');
                    let selection = d3.select(this).transition("tooltip").duration(400);
                    selection.select("text").style("font-size", '12px');
                    selection.select("path")
                        .style("stroke-width", 2);
                });

            const subscriptions = [];
            subscriptions.push(
                this.selectOutsideConceptSet.subscribe(function (newValue) {
                    if (this.selectOutsideConceptSet !== "") {
                        div.selectAll("path")
                            .filter(function(d) { return d.key === newValue;})
                            .classed("selected", function() { return !d3.select(this).classed("selected"); })
                            .style('fill', function() {

                                if (d3.select(this).classed("selected")) {
                                    return d3.select(this).attr('color');
                                } else {
                                    return d3.select(this).attr('defaultColor');
                                }
                            });
                    }
                })
            );
        }

        calculateCoordinate(circles,rightCircleEqual) {
            if (!rightCircleEqual) {
                return circles;
            }

            const findNumbers = /-?\d+(\.\d+)?/g;
            let csLeftCircle = circles[0];
            let csRightCircle = circles[1];
            let csCommonCircle = circles[2];
            const [startX, startY] = csCommonCircle.match(/M\s(.*)/)[0].match(findNumbers);

            if (!!csCommonCircle.match(/A\s(.*)/)) {
                const endY = csCommonCircle.match(/A\s(.*)/)[0].match(findNumbers)[6];
                const commonCurvies = csCommonCircle.match(/A\s(.*)/g);
                const commonCurveCS1 = commonCurvies[0].match(findNumbers);
                const commonCurveCS2 = commonCurvies[1].match(findNumbers);

                const cs1curve = csLeftCircle.match(/A\s(.*)/i)[0].match(findNumbers);
                csLeftCircle = `M ${Math.round(startX)} ${Math.round(startY)}
                    A ${Math.round(commonCurveCS1[0])} ${Math.round(commonCurveCS1[1])} 0 ${commonCurveCS1[3]} ${commonCurveCS1[4]} ${Math.round(startX)} ${Math.round(endY) - 1}
                    A ${Math.round(cs1curve[0])} ${Math.round(cs1curve[1])} 0 1 0 ${Math.round(startX)} ${Math.round(startY)} z`;

                const cs2curve = csRightCircle.match(/A\s(.*)/i)[0].match(findNumbers);
                csCommonCircle = `M ${Math.round(startX)} ${Math.round(startY)}
                    A ${Math.round(commonCurveCS2[0])} ${Math.round(commonCurveCS2[1])} 0 0 0 ${Math.round(startX)} ${Math.round(endY)}
                    A ${Math.round(cs2curve[0])} ${Math.round(cs2curve[1])} 0 ${cs2curve[3]} 1 ${Math.round(startX)} ${Math.round(startY) - 1} z`;

                csRightCircle = '';
            } else {
                const commonCurve = csCommonCircle.match(/a\s(.*)/)[0].match(findNumbers);
                const cs1curve = csLeftCircle.match(/a\s(.*)/i)[0].match(findNumbers);
                const sX = Number(startX) + Number(commonCurve[0]);
                const sY = startY;

                csLeftCircle =`M ${sX} ${sY}
                    A ${commonCurve[0]} ${commonCurve[1]} 0 1 1 ${sX} ${sY - 0.1}
                    A ${cs1curve[0]} ${cs1curve[1]} 0 1 0 ${sX} ${sY} z`;
            }

            return [csLeftCircle,csRightCircle,csCommonCircle];
        }

        export() {
            const svg = this.container.element.querySelector('svg');
            ChartUtils.downloadSvgAsPng(svg, this.chartName() || "untitled.png");
        }
        exportSvg() {
            const svg = this.container.element.querySelector('svg');
            ChartUtils.downloadSvg(svg, this.chartName() + ".svg" || "untitled.svg");
        }

    }

    return commonUtils.build('venn-diagram', Venn, view);
});