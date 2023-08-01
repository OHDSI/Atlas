define([
    'knockout',
    'clipboard',
    'pages/characterizations/services/FeatureAnalysisService',
    'pages/characterizations/services/PermissionService',
    'components/cohortbuilder/CriteriaGroup',
    'components/cohortbuilder/AdditionalCriteria',
    'components/cohortbuilder/WindowedCriteria',
    'components/cohortbuilder/CriteriaTypes/DemographicCriteria',
    'text!./feature-analysis-view-edit.html',
    'appConfig',
    'atlas-state',
    'services/AuthAPI',
    'services/Vocabulary',
    'services/Permission',
    'components/security/access/const',
    'components/conceptset/InputTypes/ConceptSet',
    'components/conceptset/ConceptSetStore',
    'pages/Page',
    'pages/characterizations/const',
    'utils/AutoBind',
    'utils/CommonUtils',
    'utils/Clipboard',
    'assets/ohdsi.util',
    '../../utils',
    'const',
    './const',
    'lodash',
    'less!./feature-analysis-view-edit.less',
    './fa-view-edit/fa-design',
    './fa-view-edit/fa-conceptset',
    'components/cohortbuilder/components',
    'circe',
    'components/multi-select',
    'components/DropDownMenu',
    'components/heading',
    'components/authorship',
    'components/security/access/configure-access-modal',
    'components/tabs',
    'components/name-validation',
], function (
    ko,
    clipboard,
    FeatureAnalysisService,
    PermissionService,
    CriteriaGroup,
    AdditionalCriteria,
    WindowedCriteria,
    DemographicGriteria,
    view,
    config,
    sharedState,
    authApi,
    VocabularyAPI,
    GlobalPermissionService,
	{ entityType },
    ConceptSet,
    ConceptSetStore,
    Page,
    constants,
    AutoBind,
    commonUtils,
    Clipboard,
    ohdsiUtil,
    utils,
    globalConstants,
	componentConst,
    lodash,
) {

    const featureTypes = {
        PRESET: 'PRESET',
        CRITERIA_SET: 'CRITERIA_SET',
        CUSTOM_FE: 'CUSTOM_FE',
    };

    const statTypeOptions = [
      { label: 'Prevalence', value: 'PREVALENCE' },
      { label: 'Distribution', value: 'DISTRIBUTION' },
    ];

    const defaultDomain = { label: 'Any', value: componentConst.ANY_DOMAIN };

    class FeatureAnalysisViewEdit extends AutoBind(Clipboard(Page)) {
        constructor(params) {
            super(params);
            this.featureId = sharedState.FeatureAnalysis.selectedId;
            this.data = sharedState.FeatureAnalysis.current;
            this.conceptSetStore = ConceptSetStore.getStore(ConceptSetStore.sourceKeys().featureAnalysis);
            this.conceptSets = ko.pureComputed(() => this.data() && this.data().conceptSets)
            this.domains = ko.observable([]);
            this.aggregates = ko.observable({});
            this.previousDesign = {};
            this.defaultName = ko.unwrap(globalConstants.newEntityNames.featureAnalysis);
            this.defaultAggregate = ko.observable();

            this.dataDirtyFlag = sharedState.FeatureAnalysis.dirtyFlag;
            this.loading = ko.observable(false);
            this.isAuthenticated = ko.pureComputed(() => {
                return authApi.isAuthenticated();
            });
            this.isCopying = ko.observable(false);

            this.canEdit = this.isUpdatePermittedResolver();
            this.isNameFilled = ko.computed(() => {
                return this.data() && this.data().name() && this.data().name().trim();
            });
            this.isNameCharactersValid = ko.computed(() => {
                return this.isNameFilled() && commonUtils.isNameCharactersValid(this.data().name());
            });
            this.isNameLengthValid = ko.computed(() => {
                return this.isNameFilled() && commonUtils.isNameLengthValid(this.data().name());
            });
            this.isDefaultName = ko.computed(() => {
                return this.isNameFilled() && this.data().name().trim() === this.defaultName;
            });
            this.isNameCorrect = ko.computed(() => {
                return this.isNameFilled() && !this.isDefaultName() && this.isNameCharactersValid() && this.isNameLengthValid();
            });
            this.canSave = ko.computed(() => {
                return this.dataDirtyFlag().isDirty() &&
                    this.areRequiredFieldsFilled() &&
                    this.isNameCorrect() &&
                    (this.featureId() === 0 ? this.isCreatePermitted() : this.canEdit());
            });
            this.isViewPermitted = this.isViewPermittedResolver();
            this.canDelete = this.isDeletePermittedResolver();
            this.isNewEntity = this.isNewEntityResolver();
            this.canCopy = this.isCopyPermittedResolver();

            this.saveTooltipText = this.getSaveTooltipTextComputed();

            this.featureTypes = featureTypes;
            this.statTypeOptions = ko.observableArray(statTypeOptions);

            this.featureCaption = ko.computed(() => {
                if (this.data()){
                    if (this.featureId() !== 0) {
                        return ko.i18nformat('cc.fa.caption', 'Feature Analysis #<%=id%>', {id: this.featureId()})();
                    } else {
                        return this.defaultName;
                    }
                }
            });
            this.isSaving = ko.observable(false);
            this.isDeleting = ko.observable(false);
            this.isProcessing = ko.computed(() => {
                return this.isSaving() || this.isDeleting() || this.isCopying();
            });
            this.initialFeatureType = ko.observable();
            this.isPresetFeatureTypeAvailable = ko.pureComputed(() => {
                return !this.isNewEntity() && this.initialFeatureType() === featureTypes.PRESET;
            });
            this.editorClasses = ko.computed(() => this.classes({ element: 'content', modifiers: this.canEdit() ? '' : 'disabled' }))
            this.enablePermissionManagement = config.enablePermissionManagement;	                
            this.selectedTabKey = ko.observable();
            this.componentParams = ko.observable({
              ...params,
              featureId: this.featureId,
              data: this.data,
              dataDirtyFlag: this.dataDirtyFlag,
              canEdit: this.canEdit,
              domains: this.domains,
              featureTypes: this.featureTypes,
              statTypeOptions: this.statTypeOptions,
              setType: this.setType,
              getEmptyCriteriaFeatureDesign: this.getEmptyCriteriaFeatureDesign,
              getEmptyWindowedCriteria: this.getEmptyWindowedCriteria,
              conceptSetStore: this.conceptSetStore,
              loadConceptSet: this.loadConceptSet,
              defaultAggregate: this.defaultAggregate,
              aggregates: this.aggregates,
            });
            this.tabs = ko.computed(() => {
                const tabs = [
                    {
                      title: ko.i18n('cc.fa.tabs.design', 'Design'),
                      key: 'design',
                      componentName: 'feature-analysis-design',
                      componentParams: this.componentParams,
                    },
                ];
                if (this.data() && this.data().type() === this.featureTypes.CRITERIA_SET) {
                    tabs.push({
                      title: ko.i18n('cc.fa.tabs.conceptSets', 'Concept Sets'),
                      key: 'conceptset',
                      componentName: 'feature-analysis-conceptset',
                      componentParams: this.componentParams,
                    });
                }
              return tabs;
            });

			GlobalPermissionService.decorateComponent(this, {
				entityTypeGetter: () => entityType.FE_ANALYSIS,
				entityIdGetter: () => this.featureId(),
				createdByUsernameGetter: () => this.data() && this.data().createdBy()
			});
        }

        async onPageCreated() {
            await this.loadDomains();
            await this.loadAggregates();
            super.onPageCreated();
        }

        onRouterParamsChanged({ id, section }) {
            if (id !== undefined) {
                this.featureId(parseInt(id));
                if (this.featureId() === 0) {
                    this.setupAnalysisData({});
                } else {
                    this.loadDesign(this.featureId());
                }
            }
            if (section !== undefined) {
							this.selectedTabKey(section);
						}
        }

        isCreatePermitted() {
            return PermissionService.isPermittedCreateFa();
        }

        isViewPermittedResolver() {
            return ko.pureComputed(
                () => PermissionService.isPermittedGetFa(this.featureId())
            );
        }

        isUpdatePermittedResolver() {
            return ko.computed(() => this.featureId() === 0 || PermissionService.isPermittedUpdateFa(this.featureId()));
        }

        isCopyPermittedResolver() {
            return ko.pureComputed(() => this.data() && this.data().type() !== 'PRESET' && PermissionService.isPermittedCopyFa(this.featureId()));
        }

        isDeletePermittedResolver(id) {
            return ko.computed(() => PermissionService.isPermittedDeleteFa(this.featureId()));
        }

        isNewEntityResolver() {
            return ko.computed(() => this.featureId() === 0);
        }

        selectTab(index, { key }) {
            commonUtils.routeTo('/cc/feature-analyses/' + this.componentParams().featureId() + '/' + key);
        }

        areRequiredFieldsFilled() {
            const isDesignFilled = this.data() && ((typeof this.data().design() === 'string' || Array.isArray(this.data().design())) && this.data().design().length > 0);
            return this.data() && (this.isNameFilled() &&
                                   typeof this.data().type() === 'string' &&
                                   this.data().type().length > 0 &&
                                   isDesignFilled);
        }

        getSaveTooltipTextComputed() {
            return ko.computed(() => {
               if (!(this.featureId() === 0 ? this.isCreatePermitted() : this.canEdit())) {
                   return ko.i18n('common.notEnoughPermissions', 'Not enough permissions')();
               } else if (this.areRequiredFieldsFilled()) {
                   if (!this.dataDirtyFlag().isDirty()){
                       return ko.i18n('common.noChangesToPersist', 'No changes to persist')();
                   } else {
                       return "";
                   }
               } else {
                   return ko.i18n('cc.fa.designOrNameAreEmpty', 'Design or Name are empty')();
               }
            });
        }

        selectAggregate(item, data) {
            console.log('setAggregate', data);
            data.aggregate(item);
        }

        async loadAggregates() {
            const aggregates = await FeatureAnalysisService.loadAggregates();
            const aggregateMap = lodash.sortBy(aggregates.reduce((map, ag) => {
                ag.isDefault && this.defaultAggregate(ag);
                const domainId = ag.domain || componentConst.ANY_DOMAIN;
                let domain = map.find(d => d.value === domainId);
                if (!domain) {
                    domain = {
                        ...this.domains().find(d => d.value === domainId) || defaultDomain,
                      aggregates: [],
                    };
                    map.push(domain);
                }
                domain.aggregates.push(ag);
                return map;
                }, []), a => a.label)
              .map(d => ({
                ...d,
                aggregates: lodash.sortBy(d.aggregates, a => a.name),
              }));
            this.aggregates(aggregateMap);
        }

        async loadDomains() {
            const domains = await FeatureAnalysisService.loadFeatureAnalysisDomains();
            this.domains(domains.map(d => ({ label: d.name, value: d.id })));
        }

        async loadDesign(id) {
            if (this.data() && (this.data().id || 0 === id)) return;
            if (this.dataDirtyFlag().isDirty() && !confirm(ko.unwrap(ko.i18n('cc.fa.unsavedConfirmation', 'Your changes are not saved. Would you like to continue?')))) {
                return;
            }
            try {
                this.loading(true);
                const featureAnalysis = await FeatureAnalysisService.loadFeatureAnalysis(id);
                this.setupAnalysisData(featureAnalysis);
            } finally {
                this.loading(false);
            }
        }

        setupAnalysisData({ id = 0, name = '', descr = '', domain = null, type = '', design= '', conceptSets = [], statType = 'PREVALENCE', createdBy, createdDate, modifiedBy, modifiedDate }) {
            const isDomainAvailable = !!this.domains() && !!this.domains()[0];
            const defaultDomain = isDomainAvailable ? this.domains()[0].value : '';
            const anaylysisDomain = domain || defaultDomain;
            this.initialFeatureType(type);
            let parsedDesign;
            const data = {
              id: id,
              name: ko.observable(),
              domain: ko.observable(),
              descr: ko.observable(),
              type: ko.observable(),
              design: ko.observable(),
              statType: ko.observable(),
              conceptSets: ko.observableArray(),
              createdBy: ko.observable(),
              createdDate: ko.observable(),
              modifiedBy: ko.observable(),
              modifiedDate: ko.observable(),
            };
            data.conceptSets(conceptSets.map(s => new ConceptSet(s)));

            if (type === this.featureTypes.CRITERIA_SET) {
                parsedDesign = design.map(c => {
                    const commonDesign = {
                        id: c.id,
                        name: ko.observable(c.name),
                        criteriaType: c.criteriaType,
                        aggregate: ko.observable(c.aggregate),
                    };
                    if (c.criteriaType === 'CriteriaGroup') {
                        return {
                            ...commonDesign,
                            expression: ko.observable(new CriteriaGroup(c.expression, data.conceptSets)),
                        };
                    } else if (c.criteriaType === 'DemographicCriteria') {
                        return {
                            ...commonDesign,
                            expression: ko.observable(new DemographicGriteria(c.expression, data.conceptSets)),
                        };
                    } else if (c.criteriaType === 'WindowedCriteria' && c.expression.Criteria) {
                        return {
                            ...commonDesign,
                            expression: ko.observable(new WindowedCriteria(c.expression, data.conceptSets)),
                        };
                    }
                }).filter(c => c);
            } else {
                parsedDesign = design;
            }

            data.name(name || this.defaultName);
            data.descr(descr);
            data.domain(anaylysisDomain);
            data.type(type);
            data.design(parsedDesign);
            data.statType(statType);
            data.statType.subscribe(() => this.data().design([]));
            data.createdBy(createdBy);
            data.createdDate(createdDate);
            data.modifiedBy(modifiedBy);
            data.modifiedDate(modifiedDate);
            this.data(data);
            this.dataDirtyFlag(new ohdsiUtil.dirtyFlag(this.data()));
            this.previousDesign = { [type]: parsedDesign };
        }

        setType(type) {
            let prevType = this.data().type();
            let prevDesign = this.data().design();

            if (type === this.featureTypes.CRITERIA_SET) {
                let newDesign = this.previousDesign[type] || [this.getEmptyCriteriaFeatureDesign()];
                this.data().design(newDesign);
            } else {
                let newDesign = this.previousDesign[type] || null;
                this.data().design(newDesign);
            }
            this.data().type(type);

            this.previousDesign[prevType] = prevDesign;
        }

        getEmptyCriteriaFeatureDesign() {
            return {
                name: ko.observable(''),
                criteriaType: 'CriteriaGroup',
                aggregate: ko.observable(ko.unwrap(this.defaultAggregate)),
                conceptSets: this.data().conceptSets,
                expression: ko.observable(new CriteriaGroup(null, this.data().conceptSets)),
            };
        }

        getEmptyWindowedCriteria(type) {
            const data = { Criteria: {} };
            data.Criteria[type] = { IgnoreObservationPeriod: true, };
            return {
                name: ko.observable(''),
                criteriaType: 'WindowedCriteria',
                aggregate: ko.observable(ko.unwrap(this.defaultAggregate)),
                expression: ko.observable(new WindowedCriteria(data, this.data().conceptSets)),
            };
        }

        async save() {
            this.isSaving(true);

            let faName = this.data().name();
            this.data().name(faName.trim());

            // Next check to see that a feature analysis with this name does not already exist
            // in the database. Also pass the id so we can make sure that the current feature analysis is excluded in this check.
           try{
                const results = await FeatureAnalysisService.exists(this.data().name(), this.featureId());
                if (results > 0) {
                    alert(ko.unwrap(ko.i18n('cc.fa.nameExistsAlert', 'A feature analysis with this name already exists. Please choose a different name.')));
                } else {
                    if (this.featureId() < 1) {
                        const res = await FeatureAnalysisService.createFeatureAnalysis(this.data());
                        this.dataDirtyFlag().reset();
                        commonUtils.routeTo('/cc/feature-analyses/' + res.id);
                    } else {
                        const res = await FeatureAnalysisService.updateFeatureAnalysis(this.featureId(), this.data());
                        this.setupAnalysisData(res);
                    }
                }
            } catch (e) {
                alert(ko.unwrap(ko.i18n('cc.fa.saveError', 'An error occurred while attempting to save a feature analysis.')));
            } finally {
               this.isSaving(false);
               this.loading(false);
           }
        }

        deleteFeature() {
            commonUtils.confirmAndDelete({
                loading: this.loading,
                remove: () => {
                    this.isDeleting(true);
                    FeatureAnalysisService.deleteFeatureAnalysis(this.featureId())
                },
                redirect: () => {
                    this.isDeleting(false);
                    this.closeAnalysis();
                },
            });
        }

        closeAnalysis() {
            if (this.dataDirtyFlag().isDirty() && !confirm(ko.unwrap(ko.i18n('cc.fa.unsavedConfirmation', 'Your changes are not saved. Would you like to continue?')))) {
              return;
            }
            this.data(null);
            this.featureId(null);
            this.dataDirtyFlag().reset();
            this.conceptSetStore.clear();
            commonUtils.routeTo('/cc/feature-analyses');
        }

        copyAnalysisSQLTemplateToClipboard() {
            this.copyToClipboard('#btnCopyAnalysisSQLTemplateClipboard', '#copyAnalysisSQLTemplateMessage');
        }

        async copyFeatureAnalysis() {
            this.isCopying(true);
            this.loading(true);
            try {
                const { data } = await FeatureAnalysisService.copyFeatureAnalysis(this.featureId());
                this.setupAnalysisData(data);
                commonUtils.routeTo(`cc/feature-analyses/${data.id}`);
            } catch(err) {
                console.error(err);
                alert('Failed to copy feature analysis.');
            } finally {
                this.isCopying(false);
                this.loading(false);
            }
        }

        getAuthorship() {
            const createdDate = commonUtils.formatDateForAuthorship(this.data().createdDate);
            const modifiedDate = commonUtils.formatDateForAuthorship(this.data().modifiedDate);
            return {
                createdBy: this.data().createdBy() ? this.data().createdBy().name : '',
                createdDate: createdDate,
                modifiedBy: this.data().modifiedBy() ? this.data().modifiedBy().name : '',
                modifiedDate: modifiedDate,
            }
        }

				loadConceptSet(conceptSetId) {
                    this.conceptSetStore.current(this.conceptSets()().find(item => item.id == conceptSetId));
                    this.conceptSetStore.isEditable(this.canEdit());
				    commonUtils.routeTo(`/cc/feature-analyses/${this.data().id}/conceptset`);
				}
    }

    return commonUtils.build('feature-analysis-view-edit', FeatureAnalysisViewEdit, view);
});
