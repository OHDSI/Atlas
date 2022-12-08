define([
    'knockout',
    'components/Chart',
    'components/Component',
    'atlascharts',
    'text!components/charts/chart.html',
    'utils/CommonUtils'
], function (
    ko,
    Chart,
    Component,
    atlascharts,
    view,
    commonUtils
) {
    class HorizontalBoxPlot extends Chart {
        constructor(params, element) {
            super(params, element);
            this.renderer = new atlascharts.horizontalBoxplot();
        }
    }

    return commonUtils.build('horizontal-boxplot', HorizontalBoxPlot, view);
});