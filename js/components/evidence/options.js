define(['components/evidence/utils'], function (utils) {

    var options = {};

    options.negControlTableColumns = [
        {
            title: 'Id',
            data: d => d.conceptId,
            visible: false,
        },
        {
            title: '',
            render: (s, p, d) => {
                if (utils.hasEvidence(d)) {
                    return '<button type=\"button\" title=\"View Details\" class=\"btn btn-default btn-xs\"><i class=\"fa fa-external-link\" aria-hidden=\"true\"></i>&nbsp;</button>';
                }
            },
            sortable: false,
        },
        {
            title: 'Name',
            render: (s, p, d) => {
                return '<a target=\"_new\" href=\'#/concept/' + d.conceptId + '\'>' + d.conceptName + '</a>';
            },
        },
        {
            title: 'Domain',
            data: d => d.domainId,
            visible: false,
        },
        {
            title: 'Suggested Negative Control',
            render: (s, p, d) => {
                return utils.formatBooleanDisplay(d.negativeControl);
            },
        },
        {
            title: 'Sort Order',
            render: (s, p, d) => {
                return utils.formatNumberWithCommas(d.sortOrder);
            },
        },
        {
            title: 'Publication Count (Descendant Concept Match)',
            render: (s, p, d) => {
                return utils.formatNumberWithCommas(d.descendantPmidCount);
            },
        },
        {
            title: 'Publication Count (Exact Concept Match)',
            render: (s, p, d) => {
                return utils.formatNumberWithCommas(d.exactPmidCount);
            },
            orderable: true,
            searchable: true
        },
        {
            title: 'Publication Count (Parent Concept Match)',
            render: (s, p, d) => {
                return utils.formatNumberWithCommas(d.parentPmidCount);
            },
        },
        {
            title: 'Publication Count (Ancestor Concept Match)',
            render: (s, p, d) => {
                return utils.formatNumberWithCommas(d.ancestorPmidCount);
            },
            visible: false,
        },
        {
            title: 'Indicated / Contraindicated',
            render: (s, p, d) => {
                return utils.formatBooleanDisplay(d.indCi);
            },
            visible: false,
        },
        {
            title: 'Broad Concept',
            render: (s, p, d) => {
                return utils.formatBooleanDisplay(d.tooBroad);
            },
            visible: false,
        },
        {
            title: 'Drug Induced Concept',
            render: (s, p, d) => {
                return utils.formatBooleanDisplay(d.drugInduced);
            },
            visible: false,
        },
        {
            title: 'Pregnancy Concept',
            render: (s, p, d) => {
                return utils.formatBooleanDisplay(d.pregnancy);
            },
            visible: false,
        },
        {
            title: 'Product Label Count (Descendant Concept Match)',
            render: (s, p, d) => {
                return utils.formatNumberWithCommas(d.descendantSplicerCount);
            },
        },
        {
            title: 'Product Label (Exact Concept Match)',
            render: (s, p, d) => {
                return utils.formatNumberWithCommas(d.exactSplicerCount);
            },
        },
        {
            title: 'Product Label (Parent Concept Match)',
            render: (s, p, d) => {
                return utils.formatNumberWithCommas(d.parentSplicerCount);
            },
        },
        {
            title: 'Product Label (Ancestor Concept Match)',
            render: (s, p, d) => {
                return utils.formatNumberWithCommas(d.ancestorSplicerCount);
            },
            visible: false,
        },
        {
            title: 'FAERS Count (Descendant Concept Match)',
            render: (s, p, d) => {
                return utils.formatNumberWithCommas(d.descendantFaersCount);
            },
        },
        {
            title: 'FAERS Count (Exact Concept Match)',
            render: (s, p, d) => {
                return utils.formatNumberWithCommas(d.exactFaersCount);
            },
        },
        {
            title: 'FAERS Count (Parent Concept Match)',
            render: (s, p, d) => {
                return utils.formatNumberWithCommas(d.parentFaersCount);
            },
        },
        {
            title: 'FAERS Count (Ancestor Concept Match)',
            render: (s, p, d) => {
                return utils.formatNumberWithCommas(d.ancestorFaersCount);
            },
            visible: false,
        },
        {
            title: 'User Excluded',
            render: (s, p, d) => {
                return utils.formatBooleanDisplay(d.userExcluded);
            },
        },
        {
            title: 'User Included',
            render: (s, p, d) => {
                return utils.formatBooleanDisplay(d.userIncluded);
            },
        },
        {
            title: 'Optimized Out',
            render: (s, p, d) => {
                return utils.formatBooleanDisplay(d.optimizedOut);
            },
            visible: false,
        },
        {
            title: 'Not Prevalent',
            render: (s, p, d) => {
                return utils.formatBooleanDisplay(d.notPrevalent);
            },
            visible: false,
        },
        { 
            title: 'Drug Label Exists',
            render: (s, p, d) => {
                return d.drugLabelExists.toString()
            },
            visible: true,
        },
        {
            title: '<i id="dtNegCtrlRC" class="fa fa-database" aria-hidden="true"></i> RC',
            render: (s, p, d) => {
                return `<span class="ncRecordCount">${d.recordCount}</span>`;
            },
        },
        {
            title: '<i id="dtNegCtrlDRC" class="fa fa-database" aria-hidden="true"></i> DRC',
            render: (s, p, d) => {
                return `<span class="ncRecordCount">${d.descendantRecordCount}</span>`;
            },
        },
    ];

    options.negControlTableOptions = {
        lengthMenu: [
            [10, 25, 50, 100, -1],
            ['10', '25', '50', '100', 'All']
        ],
        order: [
            [4, 'desc'],
            [5, 'desc']
        ],
        Facets: [{
                'caption': 'Suggested Negative Control',
                'binding': d => {
                    return d.negativeControl.toString() == "1" ? 'Yes' : 'No';
                },
            },
            {
                'caption': 'Found in Publications',
                'binding': d => {
                    var desc = d.descenantPmidCount;
                    var exact = d.exactPmidCount;
                    var parent = d.parentPmidCount;
                    if (exact > 0) {
                        return 'Yes (Exact)'
                    } else if (desc > 0) {
                        return 'Yes (Descendant)'
                    } else if (parent > 0) {
                        return 'Yes (Parent)'
                    } else {
                        return 'No'
                    }
                },
            },
            {
                'caption': 'Found on Product Label',
                'binding': d => {
                    var desc = d.descenantSplicerCount;
                    var exact = d.exactSplicerCount;
                    var parent = d.parentSplicerCount;
                    if (exact > 0) {
                        return 'Yes (Exact)'
                    } else if (desc > 0) {
                        return 'Yes (Descendant)'
                    } else if (parent > 0) {
                        return 'Yes (Parent)'
                    } else {
                        return 'No'
                    }
                },
            },
            {
                'caption': 'Found in Product Label Or Publications',
                'binding': d => {
                    return utils.hasEvidence(d) ? 'Yes' : 'No';
                },
            },
            {
                'caption': 'Signal in FAERS',
                'binding': d => {
                    var desc = d.descenantFaersCount;
                    var exact = d.exactFaersCount;
                    var parent = d.parentFaersCount;
                    if (exact > 0) {
                        return 'Yes (Exact)'
                    } else if (desc > 0) {
                        return 'Yes (Descendant)'
                    } else if (parent > 0) {
                        return 'Yes (Parent)'
                    } else {
                        return 'No'
                    }
                },
            },
            {
                'caption': 'User Specified',
                'binding': d => {
                    var inc = d.userIncluded;
                    var exc = d.userExcluded;
                    if (inc > 0) {
                        return 'Included'
                    } else if (exc > 0) {
                        return 'Excluded'
                    } else {
                        return 'None'
                    }
                },
            },
        ]
    };

    return options;
});