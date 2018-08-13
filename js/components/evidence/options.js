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
            data: d => {
                if (utils.hasEvidence(d)) {
                    return '<button type=\"button\" title=\"View Details\" class=\"btn btn-default btn-xs\"><i class=\"fa fa-external-link\" aria-hidden=\"true\"></i>&nbsp;</button>';
                }
            },
            sortable: false,
        },
        {
            title: 'Name',
            data: d => {
                var valid = true; //d.INVALID_REASON_CAPTION == 'Invalid' ? 'invalid' : '';
                return '<a class=' + valid + ' href=\'#/concept/' + d.conceptId + '\'>' + d.conceptName + '</a>';
            },
        },
        {
            title: 'Domain',
            data: d => d.domainId,
            visible: false,
        },
        {
            title: 'Suggested Negative Control',
            data: d => {
                return d.negativeControl.toString() == "1" ? 'Y' : 'N';
            },
        },
        {
            title: 'Sort Order',
            data: d => {
                return d.sortOrder.toString()
                    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            },
        },
        {
            title: 'Publication Count (Descendant Concept Match)',
            data: d => {
                return d.descendantPmidCount.toString()
                    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            },
        },
        {
            title: 'Publication Count (Exact Concept Match)',
            render: function(s, p, d) {
                return d.exactPmidCount.toString()
                    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            },
            orderable: true,
            searchable: true
        },
        {
            title: 'Publication Count (Parent Concept Match)',
            data: d => {
                return d.parentPmidCount.toString()
                    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            },
        },
        {
            title: 'Publication Count (Ancestor Concept Match)',
            data: d => {
                return d.ancestorPmidCount.toString()
                    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            },
            visible: false,
        },
        {
            title: 'Indicated / Contraindicated',
            data: d => {
                return d.indCi.toString() == "1" ? 'Y' : 'N';
            },
            visible: false,
        },
        {
            title: 'Broad Concept',
            data: d => {
                return d.tooBroad.toString() == "1" ? 'Y' : 'N';
            },
            visible: false,
        },
        {
            title: 'Drug Induced Concept',
            data: d => {
                return d.drugInduced.toString() == "1" ? 'Y' : 'N';
            },
            visible: false,
        },
        {
            title: 'Pregnancy Concept',
            data: d => {
                return d.pregnancy.toString() == "1" ? 'Y' : 'N';
            },
            visible: false,
        },
        {
            title: 'Product Label Count (Descendant Concept Match)',
            data: d => {
                return d.descendantSplicerCount.toString()
                    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            },
        },
        {
            title: 'Product Label (Exact Concept Match)',
            data: d => {
                return d.exactSplicerCount.toString()
                    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            },
        },
        {
            title: 'Product Label (Parent Concept Match)',
            data: d => {
                return d.parentSplicerCount.toString()
                    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            },
        },
        {
            title: 'Product Label (Ancestor Concept Match)',
            data: d => {
                return d.ancestorSplicerCount.toString()
                    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            },
            visible: false,
        },
        {
            title: 'FAERS Count (Descendant Concept Match)',
            data: d => {
                return d.descendantFaersCount.toString()
                    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            },
        },
        {
            title: 'FAERS Count (Exact Concept Match)',
            data: d => {
                return d.exactFaersCount.toString()
                    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            },
        },
        {
            title: 'FAERS Count (Parent Concept Match)',
            data: d => {
                return d.parentFaersCount.toString()
                    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            },
        },
        {
            title: 'FAERS Count (Ancestor Concept Match)',
            data: d => {
                return d.ancestorFaersCount.toString()
                    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            },
            visible: false,
        },
        {
            title: 'User Excluded',
            data: d => {
                return d.userExcluded.toString() == "1" ? 'Y' : 'N';
            },
        },
        {
            title: 'User Included',
            data: d => {
                return d.userIncluded.toString() == "1" ? 'Y' : 'N';
            },
        },
        {
            title: 'Optimized Out',
            data: d => {
                return d.optimizedOut.toString() == "1" ? 'Y' : 'N';
            },
            visible: false,
        },
        {
            title: 'Not Prevalent',
            data: d => {
                return d.notPrevalent.toString() == "1" ? 'Y' : 'N';
            },
            visible: false,
        },
        { 
            title: 'Drug Label Exists',
            data: d => {
                return d.drugLabelExists.toString()
            },
            visible: true,
        },
        {
            title: '<i id="dtNegCtrlRC" class="fa fa-database" aria-hidden="true"></i> RC',
            data: d => {
                return `<span class="ncRecordCount">${d.recordCount}</span>`;
            },
        },
        {
            title: '<i id="dtNegCtrlDRC" class="fa fa-database" aria-hidden="true"></i> DRC',
            data: d => {
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