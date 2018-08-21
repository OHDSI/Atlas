define(
    (require, exports) => {
  
    var options = {};

    options.cca = {
        comparisonTableColumns: [
            {
                title: 'Target Id',
                data: d => d.targetId,
                visible: false,
            },
            {
                title: 'Target',
                data: d => d.targetName,
            },
            {
                title: 'Comparator Id',
                data: d => d.targetId,
                visible: false,
            },
            {
                title: 'Comparator',
                data: d => d.comparatorName,
            },
            {
                title: 'Outcomes',
                data: d => d.outcomeIds.length,
            },
            {
                title: 'NC Outcomes',
                data: d => d.negativeControlOutcomeIds.length,
            },
            {
                title: 'Incl Covariates',
                data: d => d.includedCovariateConceptIds.length,
                visible: false,
            },
            {
                title: 'Excl Covariates',
                data: d => d.excludedCovariateConceptIds.length,
                visible: false,
            },
        ],
        comparisonTableOptions: {
            pageLength: 10,
            lengthMenu: [
                [10, 25, 50, 100, -1],
                ['10', '25', '50', '100', 'All']
            ],
            dom: '<<"row vertical-align"<"col-xs-6"l><"col-xs-6 search"f>><"row vertical-align"><t><"row vertical-align"<"col-xs-3"i><"col-xs-9"p>>>',
        },
    }

    return options;
});