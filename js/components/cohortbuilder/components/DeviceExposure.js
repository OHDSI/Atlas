define(['knockout', '../options', '../utils', '../InputTypes/Range', '../InputTypes/Text', '../CriteriaGroup', 'text!./DeviceExposureTemplate.html'], function (ko, options, utils, Range, Text, CriteriaGroup, template) {

    function DeviceExposureViewModel(params) {
        var self = this;

        self.formatOption = function (d) {
            return '<div class="optionText">' + d.text + '</div>' +
                '<div class="optionDescription">' + d.description + '</div>';
        };

        self.addActions = [{
			text: ko.i18n('cc.viewEdit.design.subgroups.add.device-exposure.criteria.first.option.text', "Add First Exposure Criteria"),
            selected: false,
			description: ko.i18n('cc.viewEdit.design.subgroups.add.device-exposure.criteria.first.option.description', "Limit Device Exposures to first exposure in history."),
            action: function () {
				if (self.Criteria.First() == null)
					self.Criteria.First(true);
            }
        },
            {
				text: ko.i18n('cc.viewEdit.design.subgroups.add.device-exposure.criteria.age.option.text', "Add Age at Occurrence Criteria"),
                selected: false,
				description: ko.i18n('cc.viewEdit.design.subgroups.add.device-exposure.criteria.age.option.description', "Filter Device Exposures by age at occurrence."),
                action: function () {
					if (self.Criteria.Age() == null)
						self.Criteria.Age(new Range());
                }
            },
            {
				text: ko.i18n('cc.viewEdit.design.subgroups.add.device-exposure.criteria.gender.option.text', "Add Gender Criteria"),
                selected: false,
				description: ko.i18n('cc.viewEdit.design.subgroups.add.device-exposure.criteria.gender.option.description', "Filter Device Exposures based on Gender."),
                action: function () {
					if (self.Criteria.Gender() == null)
						self.Criteria.Gender(ko.observableArray());
                }
            }, {
				text: ko.i18n('cc.viewEdit.design.subgroups.add.device-exposure.criteria.occurrence-start-date.option.text', "Add Start Date Criteria"),
                selected: false,
				description: ko.i18n('cc.viewEdit.design.subgroups.add.device-exposure.criteria.occurrence-start-date.option.description', "Filter Device Exposures by the Exposure Start Date."),
                action: function () {
					if (self.Criteria.OccurrenceStartDate() == null)
						self.Criteria.OccurrenceStartDate(new Range({
							Op: "lt"
						}));
                }
            },
            {
				text: ko.i18n('cc.viewEdit.design.subgroups.add.device-exposure.criteria.occurrence-end-date.option.text', "Add End Date Criteria"),
                selected: false,
				description: ko.i18n('cc.viewEdit.design.subgroups.add.device-exposure.criteria.occurrence-end-date.option.description', "Filter Device Exposures by the Exposure End Date."),
                action: function () {
					if (self.Criteria.OccurrenceEndDate() == null)
						self.Criteria.OccurrenceEndDate(new Range({
							Op: "lt"
						}));
                }
            },
            {
				text: ko.i18n('cc.viewEdit.design.subgroups.add.device-exposure.criteria.device-type.option.text', "Add Device Type Criteria"),
                selected: false,
				description: ko.i18n('cc.viewEdit.design.subgroups.add.device-exposure.criteria.device-type.option.description', "Filter Device Exposures by the Exposure Type."),
                action: function () {
					if (self.Criteria.DeviceType() == null)
						self.Criteria.DeviceType(ko.observableArray());
                }
            },
            {
				text: ko.i18n('cc.viewEdit.design.subgroups.add.device-exposure.criteria.visit-type.option.text', "Add Visit Criteria"),
                selected: false,
				description: ko.i18n('cc.viewEdit.design.subgroups.add.device-exposure.criteria.visit-type.option.description', "Filter Device Exposures based on visit occurrence of exposure."),
                action: function () {
					if (self.Criteria.VisitType() == null)
						self.Criteria.VisitType(ko.observableArray());
                }
            },
            {
				text: ko.i18n('cc.viewEdit.design.subgroups.add.device-exposure.criteria.unique-device-id.option.text', "Add Unique Id Criteria"),
                selected: false,
				description: ko.i18n('cc.viewEdit.design.subgroups.add.device-exposure.criteria.unique-device-id.option.description', "Filter Device Exposures by Device Unique Id."),
                action: function () {
					if (self.Criteria.UniqueDeviceId() == null)
						self.Criteria.UniqueDeviceId(new Text({
							Op: "contains"
						}));
                }
            },
            {
				text: ko.i18n('cc.viewEdit.design.subgroups.add.device-exposure.criteria.quantity.option.text', "Add Quantity Criteria"),
                selected: false,
				description: ko.i18n('cc.viewEdit.design.subgroups.add.device-exposure.criteria.quantity.option.description', "Filter Device Exposures by Quantity."),
                action: function () {
					if (self.Criteria.Quantity() == null)
						self.Criteria.Quantity(new Range({
							Op: "lt"
						}));
                }
            },
            {
				text: ko.i18n('cc.viewEdit.design.subgroups.add.device-exposure.criteria.device-source-concept.option.text', "Add Device Source Concept Criteria"),
                selected: false,
				description: ko.i18n('cc.viewEdit.design.subgroups.add.device-exposure.criteria.device-source-concept.option.description', "Filter Device Exposures by the Device Source Concept."),
                action: function () {
					if (self.Criteria.DeviceSourceConcept() == null)
						self.Criteria.DeviceSourceConcept(ko.observable());
                }
            },
            /*
                         {
                            text: "Add Prior Observation Duration Criteria",
                            value: 8,
                            selected: false,
                            description: "Filter Procedure Occurrences based on Prior Observation Duration."
                                },
                        {
                            text: "Add Post Observation Duration Criteria",
                            value: 9,
                            selected: false,
                            description: "Filter Procedure Occurrences based on Prior Observation Duration."
                                },
            */
            {
				text: ko.i18n('cc.viewEdit.design.subgroups.add.device-exposure.criteria.provider-specialty.option.text', "Add Provider Specialty Criteria"),
                selected: false,
				description: ko.i18n('cc.viewEdit.design.subgroups.add.device-exposure.criteria.provider-specialty.option.description', "Filter Device Exposures based on provider specialty."),
				action: function () {
					if (self.Criteria.ProviderSpecialty() == null)
						self.Criteria.ProviderSpecialty(ko.observableArray());
				}
            },
            {
				text: ko.i18n('cc.viewEdit.design.subgroups.add.device-exposure.criteria.correlated-criteria.option.text', "Add Nested Criteria..."),
                selected: false,
				description: ko.i18n('cc.viewEdit.design.subgroups.add.device-exposure.criteria.correlated-criteria.option.description', "Apply criteria using the device exposure as the index event"),
				action: function () {
					if (self.Criteria.CorrelatedCriteria() == null)
						self.Criteria.CorrelatedCriteria(new CriteriaGroup(null, self.expression.ConceptSets));
				}
			}
        ];

        self.expression = ko.utils.unwrapObservable(params.expression);
        self.Criteria = params.criteria.DeviceExposure;
        self.options = options;

        self.removeCriterion = function (propertyName) {
            self.Criteria[propertyName](null);
        }

		self.indexMessage = ko.i18nformat('cc.viewEdit.design.subgroups.add.device-exposure.criteria.index-data.text', 'The index date refers to the device exposure of <%= conceptSetName %>.',
			{
				conceptSetName: utils.getConceptSetName(
					self.Criteria.CodesetId,
					self.expression.ConceptSets,
					ko.i18n('cc.viewEdit.design.subgroups.add.device-exposure.criteria.default-concept-name', 'Any Device'))
			});
    }

    // return compoonent definition
    return {
        viewModel: DeviceExposureViewModel,
        template: template
    };
});
