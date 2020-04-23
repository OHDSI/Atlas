define(['knockout', 'appConfig', '../options', '../utils', '../InputTypes/Range', '../CriteriaGroup', 'text!./VisitOccurrenceTemplate.html'], function (ko, config, options, utils, Range, CriteriaGroup, template) {

    function VisitOccurrenceViewModel(params) {
        var self = this;
        self.formatOption = function (d) {
            return '<div class="optionText">' + d.text + '</div>' +
                '<div class="optionDescription">' + d.description + '</div>';
        };
        self.addActions = [
            {
                text: ko.i18n('cc.viewEdit.design.subgroups.add.visit-occurrence.criteria.first.option.text', "Add First Visit Criteria"),
                selected: false,
				description: ko.i18n('cc.viewEdit.design.subgroups.add.visit-occurrence.criteria.first.option.description', "Limit Visit Occurrences to the first visit."),
                action: function () {
                    if (self.Criteria.First() == null)
                        self.Criteria.First(true);
                }
            },
            {
                text: ko.i18n('cc.viewEdit.design.subgroups.add.visit-occurrence.criteria.age.option.text', "Add Age at Occurrence Criteria"),
                selected: false,
				description: ko.i18n('cc.viewEdit.design.subgroups.add.visit-occurrence.criteria.age.option.description', "Filter Visit Occurrences by age at occurrence."),
                action: function () {
                    if (self.Criteria.Age() == null)
                        self.Criteria.Age(new Range());
                }
            },
            {
                text: ko.i18n('cc.viewEdit.design.subgroups.add.visit-occurrence.criteria.gender.option.text', "Add Gender Criteria"),
                selected: false,
				description: ko.i18n('cc.viewEdit.design.subgroups.add.visit-occurrence.criteria.gender.option.description', "Filter Visit Occurrences based on Gender."),
                action: function () {
                    if (self.Criteria.Gender() == null)
                        self.Criteria.Gender(ko.observableArray());
                }
            },
            {
                text: ko.i18n('cc.viewEdit.design.subgroups.add.visit-occurrence.criteria.occurrence-start-date.option.text', "Add Start Date Criteria"),
                selected: false,
				description: ko.i18n('cc.viewEdit.design.subgroups.add.visit-occurrence.criteria.occurrence-start-date.option.description', "Filter Visit Occurrences by the Condition Start Date."),
                action: function () {
                    if (self.Criteria.OccurrenceStartDate() == null)
                        self.Criteria.OccurrenceStartDate(new Range({
                            Op: "lt"
                        }));
                }
            },
            {
                text: ko.i18n('cc.viewEdit.design.subgroups.add.visit-occurrence.criteria.occurrence-end-date.option.text', "Add End Date Criteria"),
                selected: false,
				description: ko.i18n('cc.viewEdit.design.subgroups.add.visit-occurrence.criteria.occurrence-end-date.option.description', "Filter Visit Occurrences  by the Condition End Date"),
                action: function () {
                    if (self.Criteria.OccurrenceEndDate() == null)
                        self.Criteria.OccurrenceEndDate(new Range({
                            Op: "lt"
                        }));
                }
            },
            {
                text: ko.i18n('cc.viewEdit.design.subgroups.add.visit-occurrence.criteria.visit-type.option.text', "Add Visit Type Criteria"),
                selected: false,
				description: ko.i18n('cc.viewEdit.design.subgroups.add.visit-occurrence.criteria.visit-type.option.description', "Filter Condition Occurrences  by the Condition Type."),
                action: function () {
                    if (self.Criteria.VisitType() == null)
                        self.Criteria.VisitType(ko.observableArray());
                }
            },
            {
                text: ko.i18n('cc.viewEdit.design.subgroups.add.visit-occurrence.criteria.visit-length.option.text', "Add Visit Length Criteria"),
                selected: false,
				description: ko.i18n('cc.viewEdit.design.subgroups.add.visit-occurrence.criteria.visit-length.option.description', "Filter Visit Occurrences by duration."),
                action: function () {
                    if (self.Criteria.VisitLength() == null)
                        self.Criteria.VisitLength(new Range());
                }
            },
            {
                text: ko.i18n('cc.viewEdit.design.subgroups.add.visit-occurrence.criteria.visit-source-concept.option.text', "Add Visit Source Concept Criteria"),
                selected: false,
				description: ko.i18n('cc.viewEdit.design.subgroups.add.visit-occurrence.criteria.visit-source-concept.option.description', "Filter Visit Occurrences by the Visit Source Concept."),
                action: function () {
                    if (self.Criteria.VisitSourceConcept() == null)
                        self.Criteria.VisitSourceConcept(ko.observable());
                }
            },
            {
                text: ko.i18n('cc.viewEdit.design.subgroups.add.visit-occurrence.criteria.provider-specialty.option.text', "Add Provider Specialty Criteria"),
                selected: false,
				description: ko.i18n('cc.viewEdit.design.subgroups.add.visit-occurrence.criteria.provider-specialty.option.description', "Filter Visit Occurrences based on provider specialty."),
                action: function () {
                    if (self.Criteria.ProviderSpecialty() == null)
                        self.Criteria.ProviderSpecialty(ko.observableArray());
                }
            },
            {
                text: ko.i18n('cc.viewEdit.design.subgroups.add.visit-occurrence.criteria.place-of-service.option.text', "Add Place of Service Criteria"),
                selected: false,
				description: ko.i18n('cc.viewEdit.design.subgroups.add.visit-occurrence.criteria.place-of-service.option.description', "Filter Visit Occurrences based on Place of Service."),
                action: function () {
                    if (self.Criteria.PlaceOfService() == null)
                        self.Criteria.PlaceOfService(ko.observableArray());
                }
            },
            {
                text: ko.i18n('cc.viewEdit.design.subgroups.add.visit-occurrence.criteria.place-of-service-location.option.text', "Add Place of Service Location Criteria"),
                selected: false,
				description: ko.i18n('cc.viewEdit.design.subgroups.add.visit-occurrence.criteria.place-of-service-location.option.description', "Filter Visit Occurrences based on where Place of Service is located."),
                action: function () {
                    if (self.Criteria.PlaceOfServiceLocation() === undefined) {
                        self.Criteria.PlaceOfServiceLocation(null);
                    }
                }
            },
            {
                text: ko.i18n('cc.viewEdit.design.subgroups.add.visit-occurrence.criteria.correlated-criteria.option.text', "Add Nested Criteria..."),
                selected: false,
				description: ko.i18n('cc.viewEdit.design.subgroups.add.visit-occurrence.criteria.correlated-criteria.option.description', "Apply criteria using the visit occurrence as the index event"),
                action: function () {
                    if (self.Criteria.CorrelatedCriteria() == null)
                        self.Criteria.CorrelatedCriteria(new CriteriaGroup(null, self.expression.ConceptSets));
                }
            }
        ];

        if (config.features.locationDistance) {
            self.addActions.splice(self.addActions.length - 1, 0, {
                text: ko.i18n('cc.viewEdit.design.subgroups.add.visit-occurrence.criteria.place-of-service-distance.option.text', "Add Place of Service Distance Criteria"),
                selected: false,
				description: ko.i18n('cc.viewEdit.design.subgroups.add.visit-occurrence.criteria.place-of-service-distance.option.description', "Filter Visit Occurrences based on distance from Place of Service to Patient."),
                action: function () {
                    if (self.Criteria.PlaceOfServiceDistance() === undefined) {
                        self.Criteria.PlaceOfServiceDistance(new Range());
                    }
                }
            });
        }

        self.expression = ko.utils.unwrapObservable(params.expression);
        self.Criteria = params.criteria.VisitOccurrence;
        self.options = options;

        self.removeCriterion = function (propertyName) {
            self.Criteria[propertyName](undefined);
        }


		self.indexMessage = ko.i18nformat('cc.viewEdit.design.subgroups.add.visit-occurrence.criteria.index-data.text', 'The index date refers to the visit of <%= conceptSetName %>.',
			{
				conceptSetName: utils.getConceptSetName(
					self.Criteria.CodesetId,
					self.expression.ConceptSets,
					ko.i18n('cc.viewEdit.design.subgroups.add.visit-occurrence.criteria.default-concept-name', 'Any Visit'))
			});
    }

    // return compoonent definition
    return {
        viewModel: VisitOccurrenceViewModel,
        template: template
    };
});
