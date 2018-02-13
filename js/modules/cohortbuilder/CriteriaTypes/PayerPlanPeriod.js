define(['knockout', './Criteria', '../InputTypes/Range', '../InputTypes/Period', 'conceptpicker/InputTypes/Concept'], function (ko, Criteria, Range, Period, Concept) {
		function PayerPlanPeriod(data, conceptSets) {
				var self = this;
				data = data || {};
				
				Criteria.call(this, data, conceptSets);
				
				// set up subscription to update concepts and source concepts if the item is removed from conceptSets
				conceptSets.subscribe(function (changes) {
						changes.forEach(function(change){
										if (change.status === 'deleted') {
											if (ko.utils.unwrapObservable(self.PayerConcept()) == change.value.id)
													self.PayerConcept()(null);
											if (ko.utils.unwrapObservable(self.PlanConcept()) == change.value.id)
													self.PlanConcept()(null);
											if (ko.utils.unwrapObservable(self.SponsorConcept()) == change.value.id)
													self.SponsorConcept()(null);
											if (ko.utils.unwrapObservable(self.StopReasonConcept()) == change.value.id)
													self.StopReasonConcept()(null);
											if (ko.utils.unwrapObservable(self.PayerSourceConcept()) == change.value.id)
													self.PayerSourceConcept()(null);
											if (ko.utils.unwrapObservable(self.PlanSourceConcept()) == change.value.id)
													self.PlanSourceConcept()(null);
											if (ko.utils.unwrapObservable(self.SponsorSourceConcept()) == change.value.id)
													self.SponsorSourceConcept()(null);
											if (ko.utils.unwrapObservable(self.StopReasonSourceConcept()) == change.value.id)
													self.StopReasonSourceConcept()(null);
										}
						});
				}, null, "arrayChange");

				self.First = ko.observable(data.First || null);
				self.PeriodStartDate = ko.observable(data.PeriodStartDate && new Range(data.PeriodStartDate));
				self.PeriodEndDate = ko.observable(data.PeriodEndDate && new Range(data.PeriodEndDate));
				self.UserDefinedPeriod = ko.observable(data.UserDefinedPeriod && new Period(data.UserDefinedPeriod));
				self.PeriodLength = ko.observable(data.PeriodLength && new Range(data.PeriodLength));
				self.AgeAtStart = ko.observable(data.AgeAtStart && new Range(data.AgeAtStart));
				self.AgeAtEnd = ko.observable(data.AgeAtEnd && new Range(data.AgeAtEnd));
				self.Gender = ko.observable(data.Gender && ko.observableArray(data.Gender.map(function (d) {
						return new Concept(d);
				})));
				self.PayerConcept = ko.observable(data.PayerConcept != null ? ko.observable(data.PayerConcept) : null);
				self.PlanConcept = ko.observable(data.PlanConcept != null ? ko.observable(data.PlanConcept) : null);
				self.SponsorConcept = ko.observable(data.SponsorConcept != null ? ko.observable(data.SponsorConcept) : null);
				self.StopReasonConcept = ko.observable(data.StopReasonConcept != null ? ko.observable(data.StopReasonConcept) : null);
				
				self.PayerSourceConcept = ko.observable(data.PayerSourceConcept != null ? ko.observable(data.PayerSourceConcept) : null);
				self.PlanSourceConcept = ko.observable(data.PlanSourceConcept != null ? ko.observable(data.PlanSourceConcept) : null);
				self.SponsorSourceConcept = ko.observable(data.SponsorSourceConcept != null ? ko.observable(data.SponsorSourceConcept) : null);
				self.StopReasonSourceConcept = ko.observable(data.StopReasonSourceConcept != null ? ko.observable(data.StopReasonSourceConcept) : null);
		}
		
		PayerPlanPeriod.prototype = new Criteria();
		PayerPlanPeriod.prototype.constructor = PayerPlanPeriod;
		PayerPlanPeriod.prototype.toJSON = function () {
				return this;
		}
		
		return PayerPlanPeriod;
});