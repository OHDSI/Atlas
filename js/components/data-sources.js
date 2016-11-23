define(['jquery', 'knockout', 'text!./data-sources.html', 'd3', 'jnj_chart', 'lodash', 'appConfig', 'knockout.dataTables.binding', 'databindings/eventListenerBinding'], function ($, ko, view, d3, jnj_chart, _, config) {
    function dataSources(params) {
        var self = this;
        var RecordsPerPersonProperty = {name: "recordsPerPerson", description: "Records per person"};
        var LengthOfEraProperty = {name: "lengthOfEra", description: "Length of era"};
        var width = 1000;
        var height = 250;
        var minimum_area = 50;
        var threshold = minimum_area / (width * height);
        var treemapContainer = $("#treemap_container");

        self.model = params.model;
        self.sources = config.services[0].sources;
        self.loadingReport = ko.observable(false);
        self.loadingReportDrilldown = ko.observable(false);
        self.activeReportDrilldown = ko.observable(false);
        self.reports = [
            {name: "Dashboard", path: "dashboard"},
            {name: "Visit", path: "visit", byType: false, aggProperty: RecordsPerPersonProperty},
            {name: "Condition", path: "condition", byType: true, aggProperty: RecordsPerPersonProperty},
            {name: "Condition Era", path: "conditionera", byType: false, aggProperty: LengthOfEraProperty},
            {name: "Procedure", path: "procedure", byType: true, aggProperty: RecordsPerPersonProperty},
            {name: "Drug", path: "drug", byType: true, aggProperty: RecordsPerPersonProperty},
            {name: "Drug Era", path: "drugera", byType: false, aggProperty: LengthOfEraProperty},
            {name: "Measurement", path: "measurement", byType: true, aggProperty: RecordsPerPersonProperty},
            {name: "Observation", path: "observation", byType: true, aggProperty: RecordsPerPersonProperty},
        ];

        self.showSelectionArea = params.showSelectionArea == undefined ? true : params.showSelectionArea;
        self.currentSource = ko.observable(self.sources[0]);
        self.currentReport = ko.observable();
        self.currentConcept = ko.observable();

        self.formatPercent = d3.format('.2%');
        self.formatFixed = d3.format('.2f');
        self.formatComma = d3.format(',');
        self.treemapGradient = ["#c7eaff", "#6E92A8", "#1F425A"];
        self.boxplotWidth = 200;
        self.boxplotHeight = 125;
        self.donutWidth = 500;
        self.donutHeight = 300;

        self.runReport = function runReport() {
            self.loadingReport(true);
            self.activeReportDrilldown(false);

            var currentReport = self.currentReport();
            var currentSource = self.currentSource();
            var url = config.services[0].url + currentSource.sourceKey + '/cdmresults/' + currentReport.path;

            treemapContainer.find('svg').remove();
            $('.evidenceVisualization').empty();

            $.ajax({
                url: url,
                success: function (data) {
                    var normalizedData = self.normalizeDataframe(self.normalizeArray(data, true));
                    data = normalizedData;
                    self.loadingReport(false);

                    if (!data.empty) {
                        var tableData = normalizedData.conceptPath.map(function(d, i) {
                            var pathParts = this.conceptPath[i].split('||');
                            return {
                                concept_id: this.conceptId[i],
                                name: pathParts[pathParts.length - 1],
                                num_persons: self.formatComma(this.numPersons[i]),
                                percent_persons: self.formatPercent(this.percentPersons[i]),
                                agg_value: self.formatFixed(this[currentReport.aggProperty.name][i])
                            };
                        }, data);
                        $("#report_table").DataTable({
                            order: [1, 'desc'],
                            dom: 'T<"clear">lfrtip',
                            data: tableData,
                            createdRow: function (row) {
                                $(row).addClass('table_selector');
                            },
                            columns: [
                                { data: 'concept_id' },
                                { data: 'name' },
                                { data: 'num_persons', className: 'numeric' },
                                { data: 'percent_persons', className: 'numeric' },
                                { data: 'agg_value', className: 'numeric' }
                            ],
                            pageLength: 5,
                            lengthChange: false,
                            deferRender: true,
                            destroy: true
                        });

                        var treeData = self.buildHierarchyFromJSON(data, threshold);
                        var treemap = new jnj_chart.treemap();
                        treemap.render(treeData, '#treemap_container', width, height, {
                            onclick: function (node) {
                                self.currentConcept(node);
                            },
                            getsizevalue: function (node) { return node.num_persons; },
                            getcolorvalue: function (node) { return node.agg_value; },
                            getcolorrange: function () { return self.treemapGradient; },
                            getcontent: function (node) {
                                var result = '',
                                    steps = node.path.split('||'),
                                    i = steps.length - 1;
                                result += '<div class="pathleaf">' + steps[i] + '</div>';
                                result += '<div class="pathleafstat">Prevalence: ' + self.formatPercent(node.percent_persons) + '</div>';
                                result += '<div class="pathleafstat">Number of People: ' + self.formatComma(node.num_persons) + '</div>';
                                result += '<div class="pathleafstat">' + currentReport.aggProperty.description + ': ' + self.formatFixed(node.agg_value) + '</div>';
                                return result;
                            },
                            gettitle: function (node) {
                                var title = '',
                                    steps = node.path.split('||');
                                for (var i = 0; i < steps.length - 1; i++) {
                                    title += ' <div class="pathstep">' + Array(i + 1).join('&nbsp;&nbsp') + steps[i] + ' </div>';
                                }
                                return title;
                            }
                        });

                        $('[data-toggle="popover"]').popover();
                    }
                }
            });
        };

        function onChange(newValue) {
            if (newValue) {
                self.runReport();
            }
        }

        self.currentReport.subscribe(onChange);
        self.currentSource.subscribe(onChange);
        self.currentConcept.subscribe(function (newValue){
            if (newValue) {
                self.drilldown();
            }
        });

        self.selectTab = function(tab) {
            if (tab == 'tree') {
                // force resize of treemap (resize bug in jnj.chart)
                var aspect = width / height;
                var targetWidth = $('#content').width();
                var chart = treemapContainer.find("svg");
                chart.attr("width", targetWidth);
                chart.attr("height", Math.round(targetWidth / aspect));
            }
        };

        self.drilldown = function () {
            var currentSource = self.currentSource();
            var currentReport = self.currentReport();
            var currentConcept = self.currentConcept();
            var url = config.services[0].url + currentSource.sourceKey + '/cdmresults/' + currentReport.path + '/' + currentConcept.concept_id;

            $('.evidenceVisualization').empty();
            self.loadingReportDrilldown(true);
            self.activeReportDrilldown(false);

            $.ajax({
                type: "GET",
                url: url,
                success: function (data) {
                    self.loadingReportDrilldown(false);
                    self.activeReportDrilldown(true);

                    // age at first diagnosis visualization
                    var boxplot = new jnj_chart.boxplot();
                    var bpseries = [];
                    var bpdata = self.normalizeArray(data.ageAtFirstOccurrence);
                    if (!bpdata.empty) {
                        for (var i = 0; i < bpdata.category.length; i++) {
                            bpseries.push({
                                Category: bpdata.category[i],
                                min: bpdata.minValue[i],
                                max: bpdata.maxValue[i],
                                median: bpdata.medianValue[i],
                                LIF: bpdata.p10Value[i],
                                q1: bpdata.p25Value[i],
                                q3: bpdata.p75Value[i],
                                UIF: bpdata.p90Value[i]
                            });
                        }
                        boxplot.render(bpseries, "#ageAtFirstOccurrence", self.boxplotWidth, self.boxplotHeight, {
                            xLabel: 'Gender',
                            yLabel: 'Age at First Occurrence'
                        });
                    }

                    // prevalence by month
                    var prevData = self.normalizeArray(data.prevalenceByMonth);
                    if (!prevData.empty) {
                        var byMonthSeries = self.mapMonthYearDataToSeries(prevData, {
                            dateField: 'xCalendarMonth',
                            yValue: 'yPrevalence1000Pp',
                            yPercent: 'yPrevalence1000Pp'
                        });

                        var prevalenceByMonth = new jnj_chart.line();
                        prevalenceByMonth.render(byMonthSeries, "#prevalenceByMonth", 1000, 300, {
                            xScale: d3.time.scale().domain(d3.extent(byMonthSeries[0].values, function (d) {
                                return d.xValue;
                            })),
                            xFormat: d3.time.format("%m/%Y"),
                            tickFormat: d3.time.format("%Y"),
                            xLabel: "Date",
                            yLabel: "Prevalence per 1000 People"
                        });
                    }

                    // procedure type visualization
                    if (data.byType && data.byType.length > 0) {
                        var donut = new jnj_chart.donut();
                        donut.render(self.mapConceptData(data.byType), "#byType", self.donutWidth, self.donutHeight, {
                            margin: {
                                top: 5,
                                left: 5,
                                right: 200,
                                bottom: 5
                            }
                        });
                    }

                    // render trellis
                    var trellisData = self.normalizeArray(data.prevalenceByGenderAgeYear);
                    if (!trellisData.empty) {

                        var allDeciles = ["0-9", "10-19", "20-29", "30-39", "40-49", "50-59", "60-69", "70-79", "80-89", "90-99"];
                        var minYear = d3.min(trellisData.xCalendarYear),
                            maxYear = d3.max(trellisData.xCalendarYear);

                        var seriesInitializer = function (tName, sName, x, y) {
                            return {
                                trellisName: tName,
                                seriesName: sName,
                                xCalendarYear: x,
                                yPrevalence1000Pp: y
                            };
                        };

                        var nestByDecile = d3.nest()
                            .key(function (d) {
                                return d.trellisName;
                            })
                            .key(function (d) {
                                return d.seriesName;
                            })
                            .sortValues(function (a, b) {
                                return a.xCalendarYear - b.xCalendarYear;
                            });

                        // map data into chartable form
                        var normalizedSeries = trellisData.trellisName.map(function (d, i) {
                            var item = {};
                            var container = this;
                            d3.keys(container).forEach(function (p) {
                                item[p] = container[p][i];
                            });
                            return item;
                        }, trellisData);

                        var dataByDecile = nestByDecile.entries(normalizedSeries);
                        // fill in gaps
                        var yearRange = d3.range(minYear, maxYear, 1);

                        dataByDecile.forEach(function (trellis) {
                            trellis.values.forEach(function (series) {
                                series.values = yearRange.map(function (year) {
                                    yearData = series.values.filter(function (f) {
                                            return f.xCalendarYear === year;
                                        })[0] || seriesInitializer(trellis.key, series.key, year, 0);
                                    yearData.date = new Date(year, 0, 1);
                                    return yearData;
                                });
                            });
                        });

                        // create svg with range bands based on the trellis names
                        var chart = new jnj_chart.trellisline();
                        chart.render(dataByDecile, "#trellisLinePlot", 1000, 300, {
                            trellisSet: allDeciles,
                            trellisLabel: "Age Decile",
                            seriesLabel: "Year of Observation",
                            yLabel: "Prevalence Per 1000 People",
                            xFormat: d3.time.format("%Y"),
                            yFormat: d3.format("0.2f"),
                            tickPadding: 20,
                            colors: d3.scale.ordinal()
                                .domain(["MALE", "FEMALE", "UNKNOWN"])
                                .range(["#1F78B4", "#FB9A99", "#33A02C"])

                        });
                    }
                }
            });
        };

        self.handleTableClick = function (element, valueAccessor) {
            var dataTable = $("#report_table").DataTable();
            var rowIndex = valueAccessor.target._DT_CellIndex.row;
            var concept = dataTable.row(rowIndex).data();

            self.currentConcept(concept);
        };

        self.normalizeDataframe = function (dataframe) {
            // rjson serializes dataframes with 1 row as single element properties.  This function ensures fields are always arrays.
            var keys = d3.keys(dataframe);
            keys.forEach(function (key) {
                if (!(dataframe[key] instanceof Array)) {
                    dataframe[key] = [dataframe[key]];
                }
            });
            return dataframe;
        };

        self.normalizeArray = function (ary, numerify) {
            var obj = {};
            var keys;

            if (ary && ary.length > 0 && ary instanceof Array) {
                keys = d3.keys(ary[0]);

                $.each(keys, function () {
                    obj[this] = [];
                });

                $.each(ary, function () {
                    var thisAryObj = this;
                    $.each(keys, function () {
                        var val = thisAryObj[this];
                        if (numerify) {
                            if (_.isFinite(+val)) {
                                val = (+val);
                            }
                        }
                        obj[this].push(val);
                    });
                });
            } else {
                obj.empty = true;
            }

            return obj;
        };

        self.buildHierarchyFromJSON = function (data, threshold) {
            var total = 0;
            var currentReport = self.currentReport();

            var root = {
                "name": "root",
                "children": []
            };

            for (var i = 0; i < data.percentPersons.length; i++) {
                total += data.percentPersons[i];
            }

            for (var i = 0; i < data.conceptPath.length; i++) {
                var parts = data.conceptPath[i].split("||");
                var currentNode = root;
                for (var j = 0; j < parts.length; j++) {
                    var children = currentNode.children;
                    var nodeName = parts[j];
                    var childNode;
                    if (j + 1 < parts.length) {
                        // Not yet at the end of the path; move down the tree.
                        var foundChild = false;
                        for (var k = 0; k < children.length; k++) {
                            if (children[k].name === nodeName) {
                                childNode = children[k];
                                foundChild = true;
                                break;
                            }
                        }
                        // If we don't already have a child node for this branch, create it.
                        if (!foundChild) {
                            childNode = {
                                "name": nodeName,
                                "children": []
                            };
                            children.push(childNode);
                        }
                        currentNode = childNode;
                    } else {
                        // Reached the end of the path; create a leaf node.
                        childNode = {
                            "name": nodeName,
                            "num_persons": data.numPersons[i],
                            "concept_id": data.conceptId[i],
                            "path": data.conceptPath[i],
                            "percent_persons": data.percentPersons[i],
                            "agg_value": data[currentReport.aggProperty.name][i]
                        };

                        if ((data.percentPersons[i] / total) > threshold) {
                            children.push(childNode);
                        }
                    }
                }
            }
            return root;
        };

        self.mapMonthYearDataToSeries = function (data, options) {
            var defaults = {
                dateField: "x",
                yValue: "y",
                yPercent: "p"
            };

            var options = $.extend({}, defaults, options);

            var series = {};
            series.name = "All Time";
            series.values = [];
            if (data && !data.empty) {
                for (var i = 0; i < data[options.dateField].length; i++) {
                    var dateInt = data[options.dateField][i];
                    series.values.push({
                        xValue: new Date(Math.floor(data[options.dateField][i] / 100), (data[options.dateField][i] % 100) - 1, 1),
                        yValue: data[options.yValue][i],
                        yPercent: data[options.yPercent][i]
                    });
                }
                series.values.sort(function (a, b) {
                    return a.xValue - b.xValue;
                });
            }
            return [series]; // return series wrapped in an array
        };

        self.mapConceptData = function (data) {
            var result;

            if (data instanceof Array) {
                result = [];
                $.each(data, function () {
                    var datum = {}
                    datum.id = (+this.conceptId || this.conceptName);
                    datum.label = this.conceptName;
                    datum.value = +this.countValue;
                    result.push(datum);
                });
            } else if (data.countValue instanceof Array) // multiple rows, each value of each column is in the indexed properties.
            {
                result = data.countValue.map(function (d, i) {
                    var datum = {}
                    datum.id = (this.conceptId || this.conceptName)[i];
                    datum.label = this.conceptName[i];
                    datum.value = this.countValue[i];
                    return datum;
                }, data);


            } else // the dataset is a single value result, so the properties are not arrays.
            {
                result = [
                    {
                        id: data.conceptId,
                        label: data.conceptName,
                        value: data.countValue
                    }];
            }

            result = result.sort(function (a, b) {
                return b.label < a.label ? 1 : -1;
            });

            return result;
        };
    }

    var component = {
        viewModel: dataSources,
        template: view
    };

    ko.components.register('data-sources', component);
    return component;
});