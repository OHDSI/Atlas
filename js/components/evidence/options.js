define(['knockout', 'components/evidence/utils'], function (ko, utils) {

    var options = {};

    options.negControlTableColumns = [
        {
            title: ko.i18n('columns.id', 'Id'),
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
            title: ko.i18n('columns.name', 'Name'),
            render: (s, p, d) => {
                return '<a target=\"_new\" href=\'#/concept/' + d.conceptId + '\'>' + d.conceptName + '</a>';
            },
        },
        {
            title: ko.i18n('columns.domain', 'Domain'),
            data: d => d.domainId,
            visible: false,
        },
        {
            title: ko.i18n('columns.suggestedNegativeControl', 'Suggested Negative Control'),
            render: (s, p, d) => {
                return utils.formatBooleanDisplay(d.negativeControl);
            },
        },
        {
            title: ko.i18n('columns.sortOrder', 'Sort Order'),
            render: (s, p, d) => {
                return utils.formatNumberWithCommas(d.sortOrder);
            },
        },
        {
            title: ko.i18n('columns.publicationCountDescendant', 'Publication Count (Descendant Concept Match)'),
            render: (s, p, d) => {
                return utils.formatNumberWithCommas(d.descendantPmidCount);
            },
        },
        {
            title: ko.i18n('columns.publicationCountExact', 'Publication Count (Exact Concept Match)'),
            render: (s, p, d) => {
                return utils.formatNumberWithCommas(d.exactPmidCount);
            },
            orderable: true,
            searchable: true
        },
        {
            title: ko.i18n('columns.publicationCountParent', 'Publication Count (Parent Concept Match)'),
            render: (s, p, d) => {
                return utils.formatNumberWithCommas(d.parentPmidCount);
            },
        },
        {
            title: ko.i18n('columns.publicationCountAncestor', 'Publication Count (Ancestor Concept Match)'),
            render: (s, p, d) => {
                return utils.formatNumberWithCommas(d.ancestorPmidCount);
            },
            visible: false,
        },
        {
            title: ko.i18n('columns.indicatedContraindicated', 'Indicated / Contraindicated'),
            render: (s, p, d) => {
                return utils.formatBooleanDisplay(d.indCi);
            },
            visible: false,
        },
        {
            title: ko.i18n('columns.broadConcept', 'Broad Concept'),
            render: (s, p, d) => {
                return utils.formatBooleanDisplay(d.tooBroad);
            },
            visible: false,
        },
        {
            title: ko.i18n('columns.drugInducedConcept', 'Drug Induced Concept'),
            render: (s, p, d) => {
                return utils.formatBooleanDisplay(d.drugInduced);
            },
            visible: false,
        },
        {
            title: ko.i18n('columns.pregnancyConcept', 'Pregnancy Concept'),
            render: (s, p, d) => {
                return utils.formatBooleanDisplay(d.pregnancy);
            },
            visible: false,
        },
        {
            title: ko.i18n('columns.productLabelCountDescendant', 'Product Label Count (Descendant Concept Match)'),
            render: (s, p, d) => {
                return utils.formatNumberWithCommas(d.descendantSplicerCount);
            },
        },
        {
            title: ko.i18n('columns.productLabelExact', 'Product Label (Exact Concept Match)'),
            render: (s, p, d) => {
                return utils.formatNumberWithCommas(d.exactSplicerCount);
            },
        },
        {
            title: ko.i18n('columns.productLabelParent', 'Product Label (Parent Concept Match)'),
            render: (s, p, d) => {
                return utils.formatNumberWithCommas(d.parentSplicerCount);
            },
        },
        {
            title: ko.i18n('columns.productLabelAncestor', 'Product Label (Ancestor Concept Match)'),
            render: (s, p, d) => {
                return utils.formatNumberWithCommas(d.ancestorSplicerCount);
            },
            visible: false,
        },
        {
            title: ko.i18n('columns.faersCountDescendant', 'FAERS Count (Descendant Concept Match)'),
            render: (s, p, d) => {
                return utils.formatNumberWithCommas(d.descendantFaersCount);
            },
        },
        {
            title: ko.i18n('columns.faersCountExact', 'FAERS Count (Exact Concept Match)'),
            render: (s, p, d) => {
                return utils.formatNumberWithCommas(d.exactFaersCount);
            },
        },
        {
            title: ko.i18n('columns.faersCountParent', 'FAERS Count (Parent Concept Match)'),
            render: (s, p, d) => {
                return utils.formatNumberWithCommas(d.parentFaersCount);
            },
        },
        {
            title: ko.i18n('columns.faersCountAncestor', 'FAERS Count (Ancestor Concept Match)'),
            render: (s, p, d) => {
                return utils.formatNumberWithCommas(d.ancestorFaersCount);
            },
            visible: false,
        },
        {
            title: ko.i18n('columns.userExcluded', 'User Excluded'),
            render: (s, p, d) => {
                return utils.formatBooleanDisplay(d.userExcluded);
            },
        },
        {
            title: ko.i18n('columns.userIncluded', 'User Included'),
            render: (s, p, d) => {
                return utils.formatBooleanDisplay(d.userIncluded);
            },
        },
        {
            title: ko.i18n('columns.optimizedOut', 'Optimized Out'),
            render: (s, p, d) => {
                return utils.formatBooleanDisplay(d.optimizedOut);
            },
            visible: false,
        },
        {
            title: ko.i18n('columns.notPrevalent', 'Not Prevalent'),
            render: (s, p, d) => {
                return utils.formatBooleanDisplay(d.notPrevalent);
            },
            visible: false,
        },
        { 
            title: ko.i18n('columns.drugLabelExists', 'Drug Label Exists'),
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
                'caption': ko.i18n('facets.caption.drugLabelExists', 'Suggested Negative Control'),
                'binding': d => {
                    return d.negativeControl.toString() == "1" ? ko.i18n('options.yes', 'Yes') : ko.i18n('options.no', 'No');
                },
            },
            {
                'caption': ko.i18n('facets.caption.foundInPublications', 'Found in Publications'),
                'binding': d => {
                    var desc = d.descenantPmidCount;
                    var exact = d.exactPmidCount;
                    var parent = d.parentPmidCount;
                    if (exact > 0) {
                        return ko.i18n('options.yesExact', 'Yes (Exact)')
                    } else if (desc > 0) {
                        return ko.i18n('options.yesDescendant', 'Yes (Descendant)')
                    } else if (parent > 0) {
                        return ko.i18n('options.yesParent', 'Yes (Parent)')
                    } else {
                        return ko.i18n('options.no', 'No')
                    }
                },
            },
            {
                'caption': ko.i18n('facets.caption.foundProductLabel', 'Found on Product Label'),
                'binding': d => {
                    var desc = d.descenantSplicerCount;
                    var exact = d.exactSplicerCount;
                    var parent = d.parentSplicerCount;
                    if (exact > 0) {
                        return ko.i18n('options.yesExact', 'Yes (Exact)')
                    } else if (desc > 0) {
                        return ko.i18n('options.yesDescendant', 'Yes (Descendant)')
                    } else if (parent > 0) {
                        return ko.i18n('options.yesParent', 'Yes (Parent)')
                    } else {
                        return ko.i18n('options.no', 'No')
                    }
                },
            },
            {
                'caption': ko.i18n('facets.caption.foundInProductLabelOrPublications', 'Found in Product Label Or Publications'),
                'binding': d => {
                    return utils.hasEvidence(d) ? ko.i18n('options.yes', 'Yes') : ko.i18n('options.no', 'No');
                },
            },
            {
                'caption': ko.i18n('facets.caption.signalInFaers', 'Signal in FAERS'),
                'binding': d => {
                    var desc = d.descenantFaersCount;
                    var exact = d.exactFaersCount;
                    var parent = d.parentFaersCount;
                    if (exact > 0) {
                        return ko.i18n('options.yesExact', 'Yes (Exact)')
                    } else if (desc > 0) {
                        return ko.i18n('options.yesDescendant', 'Yes (Descendant)')
                    } else if (parent > 0) {
                        return ko.i18n('options.yesParent', 'Yes (Parent)')
                    } else {
                        return ko.i18n('options.no', 'No')
                    }
                },
            },
            {
                'caption': ko.i18n('facets.caption.userSpecified', 'User Specified'),
                'binding': d => {
                    var inc = d.userIncluded;
                    var exc = d.userExcluded;
                    if (inc > 0) {
                        return ko.i18n('options.included', 'Included')
                    } else if (exc > 0) {
                        return ko.i18n('options.excluded', 'Excluded')
                    } else {
                        return ko.i18n('options.none', 'None')
                    }
                },
            },
        ]
    };

    return options;
});