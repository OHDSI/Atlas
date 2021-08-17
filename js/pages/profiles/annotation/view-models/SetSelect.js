define(['knockout'], function (ko) {

    function SetSelect(sets, annotationView, cohortId, personId, sourceKey, sampleName, questionSetId) {
      var self = this;
      self.currentSet = ko.observable({});
      self.currentSetId = ko.observable(questionSetId);
      self.currentSet.subscribe((set) => {
        self.currentSetId(set.id);
        localStorage.setItem('currentSetId', set.id);
        annotationView.initContent(set, cohortId, personId, sourceKey, sampleName);
        annotationView.initNavigation(sampleName, cohortId, personId, sourceKey);
      });
      self.sets = ko.observableArray(sets);
  
  
      self.initialize = function(sets) {

        let currentSetId = localStorage.getItem('currentSetId');
        if (questionSetId) {
          currentSetId = questionSetId;
        }

        if (currentSetId && currentSetId.length) {
            const foundSet = sets().filter((val) => {
                return val.id === parseInt(currentSetId);
            });
            if (foundSet.length > 0) {
                self.currentSet(foundSet[0]);
            } else {
                self.currentSet(sets()[0]);
            }
        } else {
          self.currentSet(sets()[0]);
        }
      };
  
      self.initialize(self.sets);
    }
  
    SetSelect.prototype.constructor = SetSelect;
  
      return SetSelect;
  });