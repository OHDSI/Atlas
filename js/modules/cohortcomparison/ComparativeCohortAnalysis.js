define(function (require, exports) {

	var ko = require('knockout');
	var TargetComparatorDefinition = require('cohortcomparison/TargetComparatorDefinition')
	var OutcomeDefinition = require('cohortcomparison/OutcomeDefinition')
	var AnalysisDefinition = require('cohortcomparison/AnalysisDefinition')

	function ComparativeCohortAnalysis(data) {
		var self = this;
		var data = data || {};

		// Properties
		self.analysisId = data.analysisId || null;
		self.name = ko.observable(data.name || null);
		self.nameMultiLine = ko.pureComputed(function () {
			var maxLength = 45;
			var nameFormatted = [];
			if (self.name() && self.name().length > 0) {
				var nameSplit = self.name().split(" ");
				var curName = "";
				for (i = 0; i < nameSplit.length; i++) {
					if (curName.length > maxLength) {
						nameFormatted.push(curName);
						curName = "";
					}
					curName += nameSplit[i] + " ";
				}
				nameFormatted.push(curName);
			}
			return nameFormatted;
		})

		self.targetComparatorList = ko.observableArray();
		if (data.targetComparatorList && data.targetComparatorList.length > 0) {
			for (var i = 0; i < data.targetComparatorList.length; i++) {
				var tc = new TargetComparatorDefinition(data.targetComparatorList[i], data.cohortInfo, data.conceptSetInfo);
				self.targetComparatorList.push(tc);
			}
		}
		self.targetComparator = ko.pureComputed(function() {
			if (self.targetComparatorList().length <= 0) {
				self.targetComparatorList.push(new TargetComparatorDefinition());
			}
			return self.targetComparatorList()[0];
		});
		
		self.outcomeList = ko.observableArray();
		self.originalOutcomeList = [];
		if (data.outcomeList && data.outcomeList.length > 0) {
			for (i = 0; i < data.outcomeList.length; i++) {
				var o = new OutcomeDefinition(data.outcomeList[i], data.cohortInfo);
				self.outcomeList.push(o);
				self.originalOutcomeList.push(o);
			}
		}
		self.outcome = ko.pureComputed(function() {
			if (self.outcomeList().length <= 0) {
				self.outcomeList.push(new OutcomeDefinition());
			}
			return self.outcomeList()[0];
		});
		self.addOutcome = function(od) {
			// If the outcome was already part of the original definition. 
			// If yes, then preserve the internal id
			var match = self.originalOutcomeList.find(function(item) {
				return item.outcomeId() == od.outcomeId();
			});
			if (match) {
				od.id = match.id;
			}
			self.outcomeList.push(od);
			
			// Remove any default outcome definitions that might be sitting there
			self.outcomeList.remove(function (item) {
				return item.outcomeId() == 0;
			});
		}		
		self.outcomeCaption = ko.pureComputed(function() {
			if (self.outcomeList().length > 0) {
				var outcomeCaption = "";
				for (var i = 0; i < self.outcomeList().length; i++) {
					outcomeCaption += self.outcomeList()[i].outcomeCaption();
					if (i >= 0 && i < self.outcomeList().length - 2) {
						outcomeCaption += ", ";
					} else if (i >= 0 && self.outcomeList().length >= 2 && i == self.outcomeList().length - 2) {
						outcomeCaption += " and ";
					}
				}
				return outcomeCaption;
			} else {
				self.outcome().outcomeCaption();
			}
		});
		self.outcomeIdList = ko.pureComputed(function() {
			if (self.outcomeList().length > 0) {
				var outcomeIds = "";
				for (var i = 0; i < self.outcomeList().length; i++) {
					outcomeIds += self.outcomeList()[i].outcomeId();
					if (i >= 0 && i < self.outcomeList().length - 1) {
						outcomeIds += ", ";
					}
				}
				return outcomeIds;
			} else {
				self.outcome().outcomeId();
			}
		});
		
		self.analysisList = ko.observableArray();
		if (data.analysisList && data.analysisList.length > 0) {
			for (i = 0; i < data.analysisList.length; i++) {
				var a = new AnalysisDefinition(data.analysisList[i], data.conceptSetInfo);
				self.analysisList.push(a);
			}
		}
		self.analysis = ko.pureComputed(function() {
			if (self.analysisList().length <= 0) {
				self.analysisList.push(new AnalysisDefinition());
			}
			return self.analysisList()[0];
		});
	
		self.readyForDisplay = ko.pureComputed(function () {
			return (self.targetComparator().comparatorId() != null && self.targetComparator().comparatorId() > 0 &&
			self.targetComparator().targetId() != null && self.targetComparator().targetId() > 0 &&
			self.outcome().outcomeId() != null && self.outcome().outcomeId() > 0 &&
			self.analysis().modelType() != null) 
		});
		
		self.jsonify = function() { 
			var cca = {
				analysisId: self.analysisId || null,
				name: self.name(),
				targetComparatorList: [],
				outcomeList: [],
				analysisList: []
			};
			
			if (self.targetComparatorList() && self.targetComparatorList().length > 0) {
				for (i = 0; i < self.targetComparatorList().length; i++) {
					var tc = self.targetComparatorList()[i].jsonify();
					cca.targetComparatorList.push(tc);
				}
			}
			
			if (self.outcomeList() && self.outcomeList().length > 0) {
				for (i = 0; i < self.outcomeList().length; i++) {
					var o = self.outcomeList()[i].jsonify();
					cca.outcomeList.push(o);
				}
			}
			
			if (self.analysisList() && self.analysisList().length > 0) {
				for (i = 0; i < self.analysisList().length; i++) {
					var a = self.analysisList()[i].jsonify();
					cca.analysisList.push(a);
				}
			}
			
			return cca;
		}
	}
	return ComparativeCohortAnalysis;
});
