define([
    'knockout',
    'text!./from-reusables-modal.html',
    'components/Component',
    'components/conceptset/InputTypes/ConceptSet',
    'components/conceptset/InputTypes/ConceptSetItem',
    '../cohortbuilder/CriteriaTypes',
    'utils/CommonUtils',
    'utils/AutoBind',
    'utils/DatatableUtils',
    'services/AuthAPI',
    'services/Vocabulary',
    'services/ReusablesService',
    'services/Reusable',
    'less!./from-reusables-modal.less',
    'databindings',
], function (
    ko,
    view,
    Component,
    ConceptSet,
    ConceptSetItem,
    CriteriaTypes,
    commonUtils,
    AutoBind,
    datatableUtils,
    authApi,
    VocabularyAPI,
    ReusablesService,
    Reusable,
) {
    class FromReusablesModal extends AutoBind(Component) {
        constructor(params) {
            super(params);
            this.isModalShown = params.isModalShown;
            this.reusableType = params.type;
            this.parentExpression = params.parentExpression;
            this.callback = params.callback;
            this.isLoading = ko.observable(false);
            this.reusablesList = ko.observableArray();
            this.reusablesTable = {
                tableOptions: commonUtils.getTableOptions('L'),
                gridOptions: {
                    Facets: [
                        {
                            'caption': ko.i18n('facets.caption.created', 'Created'),
                            'binding': (o) => datatableUtils.getFacetForDate(o.createdDate)
                        },
                        {
                            'caption': ko.i18n('facets.caption.updated', 'Updated'),
                            'binding': (o) => datatableUtils.getFacetForDate(o.modifiedDate)
                        },
                        {
                            'caption': ko.i18n('facets.caption.author', 'Author'),
                            'binding': datatableUtils.getFacetForCreatedBy,
                        },
                        {
                            'caption': ko.i18n('facets.caption.designs', 'Designs'),
                            'binding': datatableUtils.getFacetForDesign,
                        },
                    ]
                },
                gridColumns: ko.observableArray([
                    {
                        title: ko.i18n('columns.id', 'Id'),
                        data: 'id'
                    },
                    {
                        title: ko.i18n('columns.name', 'Name'),
                        data: 'name',
                        className: this.classes('tbl-col', 'name'),
                        render: (s, p, d) => {
                            d.selectReusable = () => this.selectReusable(d);
                            return `<a data-bind="css: '${this.classes('link')}', click: selectReusable">${d.name}</a>`
                        }
                    },
                    {
                        title: ko.i18n('columns.created', 'Created'),
                        className: this.classes('tbl-col', 'created'),
                        render: datatableUtils.getDateFieldFormatter('createdDate'),
                    },
                    {
                        title: ko.i18n('columns.updated', 'Updated'),
                        className: this.classes('tbl-col', 'updated'),
                        render: datatableUtils.getDateFieldFormatter('modifiedDate'),
                    },
                    {
                        title: ko.i18n('columns.author', 'Author'),
                        render: datatableUtils.getCreatedByFormatter(),
                        className: this.classes('tbl-col', 'author'),
                    }
                ])
            };

            this.selectedReusable = ko.observable();

            this.showCsBrowser = ko.observable(false);
            this.generateCsTableId = () => {
                return 'conceptSetTableId' + Math.random();
            };
            this.criteriaContext = ko.observable();
            this.selectedParameter = ko.observable();
            this.onRepositoryCsSelected = (cs) => {
                const conceptSet = new ConceptSet(cs);
                VocabularyAPI.getConceptSetExpression(cs.id).then((expression) => {
                    conceptSet.expression.items(expression.items.map(conceptSetItem => new ConceptSetItem(conceptSetItem)));
                    this.selectedParameter().csArray.push(conceptSet);
                    this.selectedParameter().csId(cs.id);
                    this.showCsBrowser(false);
                });
            };

            this.isModalShown.subscribe(open => {
                if (!open) {
                    this.selectedReusable(null);
                    this.selectedParameter(null);
                    return;
                }
                if (this.reusablesList().length > 0) {
                    return;
                }
                setTimeout(async () => {
                    try {
                        this.isLoading(true);
                        await this.loadReusables();
                        this.isLoading(false);
                    } catch (ex) {
                        console.log(ex);
                    }
                }, 0);
            });
        }

        async loadReusables() {
            const reusables = await ReusablesService.list();
            datatableUtils.coalesceField(reusables.content, 'modifiedDate', 'createdDate');
            datatableUtils.addTagGroupsToFacets(reusables.content, this.reusablesTable.gridOptions.Facets);
            datatableUtils.addTagGroupsToColumns(reusables.content, this.reusablesTable.gridColumns);

            let list = reusables.content;
            list.forEach(r => {
                let data = r.data ? JSON.parse(r.data) : {};
                r.type = data.type || 'CRITERIA_GROUP';
            })
            this.reusablesList(list.filter(r => r.type === this.reusableType));
        }

        selectReusable(reusable) {
            this.selectedReusable(new Reusable(reusable));
            if (this.selectedReusable().parameters()) {
                this.selectedReusable().parameters().sort((l, r) => l.name() > r.name() ? 1 : -1);
                this.selectedReusable().csAndParams = ko.observableArray(
                    ko.unwrap(this.selectedReusable().conceptSets).concat(this.selectedReusable().parameters()
                        .filter(p => p.type === ReusablesService.PARAMETER_TYPE.CONCEPT_SET)
                        .map(p => p.data))
                );
                ko.utils.arrayForEach(this.selectedReusable().parameters(), p => {
                    p.csId = ko.observable();
                    p.csArray = ko.observableArray();
                    p.importCs = (a, b, event) => {
                        event.stopPropagation();
                        this.selectedParameter(p);
                        this.showCsBrowser(true);
                    }
                    p.clearCs = (a, b, event) => {
                        event.stopPropagation();
                        p.csId(null);
                        p.csArray([]);
                    }
                });
            }
        }

        backToList() {
            this.selectedReusable(null);
        }

        submit() {
            this.isModalShown(false);

            let parentExpression = ko.unwrap(this.parentExpression);

            let maxCsId = parentExpression.ConceptSets().length > 0
                ? Math.max(...parentExpression.ConceptSets().map(cs => cs.id))
                : -1;
            let i = 1;
            let csIdMap = {};

            // predefined concept sets of the reusable
            ko.utils.arrayForEach(this.selectedReusable().conceptSets(), cs => {
                let newId = maxCsId + i++;
                csIdMap[cs.id] = newId;
                cs.id = newId;
            });

            // parametrized concept sets of the reusable
            ko.utils.arrayForEach(this.selectedReusable().parameters(), p => {
                let conceptSet = p.csArray().find(cs => cs.id === p.csId());
                if (conceptSet) {
                    let newId = maxCsId + i++;
                    csIdMap[p.data.id] = newId;
                    conceptSet.id = newId;
                    this.selectedReusable().conceptSets.push(conceptSet);
                } else {
                    csIdMap[p.data.id] = null; // any condition
                }
            });

            let reusableExpression;
            switch (this.reusableType) {
                case 'INITIAL_EVENT':
                    reusableExpression = this.selectedReusable().initialEventExpression;
                    this.replaceParametersWithConceptSets(reusableExpression.CriteriaList(), csIdMap);
                    this.callback(reusableExpression, this.selectedReusable().conceptSets());
                    break;
                case 'CENSORING_EVENT':
                    reusableExpression = this.selectedReusable().censoringEventExpression;
                    this.replaceParametersWithConceptSets(reusableExpression(), csIdMap);
                    this.callback(reusableExpression, this.selectedReusable().conceptSets());
                    break;
                case 'CRITERIA_GROUP':
                    reusableExpression = this.selectedReusable().criteriaGroupExpression;
                    this.replaceParametersWithConceptSets(reusableExpression.CriteriaList(), csIdMap, true);
                    this.callback(reusableExpression, this.selectedReusable().conceptSets());
                    break;
            }
        }

        replaceParametersWithConceptSets(criteriaList, csIdMap, isGroup) {
            let replacer = (criteria, name) => {
                if (criteria.hasOwnProperty(name)) {
                    criteria[name].CodesetId(csIdMap[criteria[name].CodesetId()]);
                    if (criteria[name].CorrelatedCriteria()) {
                        this.replaceParametersWithConceptSets(criteria[name].CorrelatedCriteria().CriteriaList(), csIdMap, true);
                    }
                }
            };

            ko.utils.arrayForEach(criteriaList, c => {
                let criteria = isGroup ? c.Criteria : c;
                replacer(criteria, 'ConditionOccurrence');
                replacer(criteria, 'ConditionEra');
                replacer(criteria, 'DrugExposure');
                replacer(criteria, 'DrugEra');
                replacer(criteria, 'DoseEra');
                replacer(criteria, 'Observation');
                replacer(criteria, 'ProcedureOccurrence');
                replacer(criteria, 'VisitOccurrence');
                replacer(criteria, 'DeviceExposure');
                replacer(criteria, 'Measurement');
                replacer(criteria, 'Specimen');
                replacer(criteria, 'Death');
                replacer(criteria, 'LocationRegion');
            });
        }
    }

    return commonUtils.build('from-reusables-modal', FromReusablesModal, view);
});