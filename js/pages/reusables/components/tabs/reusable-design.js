define([
    'knockout',
    'text!./reusable-design.html',
    'utils/AutoBind',
    'components/Component',
    'utils/CommonUtils',
    'services/ReusablesService',
    '../../ReusableParameter',
    'components/conceptset/ConceptSetStore',
    'components/conceptset/utils',
    'const',
    'less!./reusable-design.less',
], function (
    ko,
    view,
    AutoBind,
    Component,
    commonUtils,
    ReusablesService,
    ReusableParameter,
    ConceptSetStore,
    conceptSetUtils,
    constants
) {
    class ReusableEditor extends AutoBind(Component) {
        constructor(params) {
            super();
            this.params = params;
            this.design = params.design;
            this.designId = params.designId;
            this.isEditPermitted = params.isEditPermitted;
            this.reusableTypes = Object.keys(constants.reusableTypes).map(key => {return {name: key, value: constants.reusableTypes[key]}});
            this.reusableType = ko.observable(this.reusableTypes.find(t => t.name === this.design().type()));
            this.reusableType.subscribe(() => {
                this.design().type(this.reusableType() && this.reusableType().name);
            });

            this.showConceptSetBrowser = ko.observable(false);
            this.criteriaContext = ko.observable();
            this.conceptSetStore = ConceptSetStore.getStore(ConceptSetStore.sourceKeys().reusables);
            this.criteriaGroupExpression = ko.observable(this.design().criteriaGroupExpression);
            this.initialEventExpression = ko.observable(this.design().initialEventExpression);
            this.censoringEventExpression = this.design().censoringEventExpression;

            this.csAndParams = ko.observableArray(
                ko.unwrap(this.design().conceptSets).concat(this.getParameters())
            );
            this.csAndParams.subscribe((newArray) => {
                let newConceptSets = newArray.filter(cs => cs.id >= 0);
                if (newConceptSets.length !== this.design().conceptSets().length) {
                    this.design().conceptSets(newConceptSets);
                }
            });
            this.design().conceptSets.subscribe((newArray) => {
                let oldConceptSets = this.csAndParams().filter(item => item.id >= 0);
                if (oldConceptSets.length !== newArray.length) {
                    this.csAndParams(newArray.concat(this.getParameters()));
                }
            });

            this.parametersTableOptions = params.tableOptions || commonUtils.getTableOptions('S');
            this.parametersTableColumns = [
                {
                    title: ko.i18n('columns.name', 'Name'),
                    data: 'name',
                    className: 'col-param-name',
                },
                {
                    title: ko.i18n('columns.type', 'Type'),
                    data: 'type',
                    className: 'col-param-type',
                },
                ...this.isEditPermitted() ? [{
                    title: ko.i18n('columns.actions', 'Actions'),
                    render: (s, p, d) => {
                        d.removeParameter = () => this.removeParameter(d);
                        return `<a data-bind="css: '${this.classes('action-link')}', click: removeParameter, text: ko.i18n('reusable.manager.design.removeParameter', 'Remove')" class="cell-action"></a>`
                    },
                    className: 'col-param-remove',
                }] : []
            ];


            this.handleConceptSetImport = (item) => {
                this.criteriaContext(item);
                this.showConceptSetBrowser(true);
            }

            this.handleEditConceptSet = (item, context) => {
                if (item.conceptSetId() == null) {
                    return;
                }
                this.loadConceptSet(item.conceptSetId());
            }

            this.loadConceptSet = (conceptSetId) => {
                this.conceptSetStore.current(this.design().conceptSets().find(item => item.id === conceptSetId));
                this.conceptSetStore.isEditable(this.isEditPermitted());
                commonUtils.routeTo(`/reusables/${this.designId()}/conceptsets`);
            }

            this.onConceptSetSelectAction = (result) => {
                this.showConceptSetBrowser(false);
                if (result.action === 'add') {
                    const conceptSets = this.design().conceptSets;
                    const newId = conceptSetUtils.newConceptSetHandler(conceptSets, this.criteriaContext());
                    this.loadConceptSet(newId)
                }

                this.criteriaContext(null);
            }
        }

        createNewParameter() {
            let newParamId = 1;
            this.design().parameters().map(p => p.id).sort((a, b) => a - b).some(id => {
                if (id !== newParamId) {
                    return true;
                } else {
                    newParamId++;
                }
            });

            let reusableParameter = new ReusableParameter({
                id: newParamId,
            });
            this.design().parameters.push(reusableParameter);
            this.csAndParams.push(reusableParameter.data);
        }

        getParameters() {
            return this.design().parameters()
                .filter(p => p.type === ReusablesService.PARAMETER_TYPE.CONCEPT_SET)
                .map(p => p.data);
        }

        removeParameter(p) {
            this.design().parameters.remove(p);
            this.csAndParams(this.csAndParams().filter(item => item.id !== -p.id));
        }
    }

    return commonUtils.build('reusable-design', ReusableEditor, view);
});
