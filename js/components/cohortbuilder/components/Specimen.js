define(['knockout', '../options', '../utils', '../InputTypes/Range', '../InputTypes/Text', '../CriteriaGroup', 'text!./SpecimenTemplate.html'], function (ko, options, utils, Range, Text, CriteriaGroup, template) {

    function SpecimenViewModel(params) {
        var self = this;
        self.expression = ko.utils.unwrapObservable(params.expression);
        self.Criteria = params.criteria.Specimen;
        self.options = options;
        self.formatOption = function (d) {
            return '<div class="optionText">' + d.text + '</div>' +
                '<div class="optionDescription">' + d.description + '</div>';
        };
        self.addActions = [
            {
                text: ko.i18n('cc.viewEdit.design.subgroups.add.specimen.criteria.first.option.text', "Add First Occurrence Criteria"),
                selected: false,
				description: ko.i18n('cc.viewEdit.design.subgroups.add.specimen.criteria.first.option.description', "Limit Specimen to the first occurrence in history."),
                action: function () {
                    if (self.Criteria.First() == null)
                        self.Criteria.First(true);
                }
            },
            {
                text: ko.i18n('cc.viewEdit.design.subgroups.add.specimen.criteria.age.option.text', "Add Age at Occurrence Criteria"),
                selected: false,
				description: ko.i18n('cc.viewEdit.design.subgroups.add.specimen.criteria.age.option.description', "Filter specimens by age at occurrence."),
                action: function () {
                    if (self.Criteria.Age() == null)
                        self.Criteria.Age(new Range());
                }
            },
            {
                text: ko.i18n('cc.viewEdit.design.subgroups.add.specimen.criteria.gender.option.text', "Add Gender Criteria"),
                selected: false,
				description: ko.i18n('cc.viewEdit.design.subgroups.add.specimen.criteria.gender.option.description', "Filter specimens based on Gender."),
                action: function () {
                    if (self.Criteria.Gender() == null)
                        self.Criteria.Gender(ko.observableArray());
                }
            },
            {
                text: ko.i18n('cc.viewEdit.design.subgroups.add.specimen.criteria.occurrence-start-date.option.text', "Add Specimen Date Criteria"),
                selected: false,
				description: ko.i18n('cc.viewEdit.design.subgroups.add.specimen.criteria.occurrence-start-date.option.description', "Filter Specimen by Date."),
                action: function () {
                    if (self.Criteria.OccurrenceStartDate() == null)
                        self.Criteria.OccurrenceStartDate(new Range({
                            Op: "lt"
                        }));
                }
            },
            {
                text: ko.i18n('cc.viewEdit.design.subgroups.add.specimen.criteria.specimen-type.option.text', "Add Specimen Type Criteria"),
                selected: false,
				description: ko.i18n('cc.viewEdit.design.subgroups.add.specimen.criteria.specimen-type.option.description', "Filter Specimen by the Type."),
                action: function () {
                    if (self.Criteria.SpecimenType() == null)
                        self.Criteria.SpecimenType(ko.observableArray());
                }
            },
            {
                text: ko.i18n('cc.viewEdit.design.subgroups.add.specimen.criteria.quantity.option.text', "Add Quantity Criteria"),
                selected: false,
				description: ko.i18n('cc.viewEdit.design.subgroups.add.specimen.criteria.quantity.option.description', "Filter Observations  by the Quantity."),
                action: function () {
                    if (self.Criteria.Quantity() == null)
                        self.Criteria.Quantity(new Range({
                            Op: "lt"
                        }));
                }
            },
            {
                text: ko.i18n('cc.viewEdit.design.subgroups.add.specimen.criteria.unit.option.text', "Add Unit Criteria"),
                selected: false,
				description: ko.i18n('cc.viewEdit.design.subgroups.add.specimen.criteria.unit.option.description', "Filter Specimens by Unit."),
                action: function () {
                    if (self.Criteria.Unit() == null)
                        self.Criteria.Unit(ko.observableArray());
                }
            },
            {
                text: ko.i18n('cc.viewEdit.design.subgroups.add.specimen.criteria.anatomic-site.option.text', "Add Anatomic Site Criteria"),
                selected: false,
				description: ko.i18n('cc.viewEdit.design.subgroups.add.specimen.criteria.anatomic-site.option.description', "Filter Specimens by the Anatomic Site."),
                action: function () {
                    if (self.Criteria.AnatomicSite() == null)
                        self.Criteria.AnatomicSite(ko.observableArray());
                }
            },
            {
                text: ko.i18n('cc.viewEdit.design.subgroups.add.specimen.criteria.disease-status.option.text', "Add Disease Status Criteria"),
                selected: false,
				description: ko.i18n('cc.viewEdit.design.subgroups.add.specimen.criteria.disease-status.option.description', "Filter Specimens by the Disease Status."),
                action: function () {
                    if (self.Criteria.DiseaseStatus() == null)
                        self.Criteria.DiseaseStatus(ko.observableArray());
                }
            },
            {
                text: ko.i18n('cc.viewEdit.design.subgroups.add.specimen.criteria.source-id.option.text', "Add Source ID Criteria"),
                selected: false,
				description: ko.i18n('cc.viewEdit.design.subgroups.add.specimen.criteria.source-id.option.description', "Filter Specimens by the Source ID."),
                action: function () {
                    if (self.Criteria.SourceId() == null)
                        self.Criteria.SourceId(new Text({
                            Op: "contains"
                        }));
                }
            },
            {
                text: ko.i18n('cc.viewEdit.design.subgroups.add.specimen.criteria.correlated-criteria.option.text', "Add Nested Criteria..."),
                selected: false,
				description: ko.i18n('cc.viewEdit.design.subgroups.add.specimen.criteria.correlated-criteria.option.description', "Apply criteria using the specimen as the index event"),
                action: function () {
                    if (self.Criteria.CorrelatedCriteria() == null)
                        self.Criteria.CorrelatedCriteria(new CriteriaGroup(null, self.expression.ConceptSets));
                }
            }
        ];

        self.removeCriterion = function (propertyName) {
            self.Criteria[propertyName](null);
        }

        self.indexMessage = ko.pureComputed(() => {
            var conceptSetName = utils.getConceptSetName(self.Criteria.CodesetId, self.expression.ConceptSets, '');
            return `The index date refers to the specimen of ${conceptSetName}.`;
        });

		self.indexMessage = ko.i18nformat('cc.viewEdit.design.subgroups.add.specimen.criteria.index-data.text', 'The index date refers to the specimen of <%= conceptSetName %>.',
			{
				conceptSetName: utils.getConceptSetName(
					self.Criteria.CodesetId,
					self.expression.ConceptSets,
					ko.i18n('cc.viewEdit.design.subgroups.add.specimen.criteria.default-concept-name', 'Any Specimen'))
			});

    }

    // return compoonent definition
    return {
        viewModel: SpecimenViewModel,
        template: template
    };
});
