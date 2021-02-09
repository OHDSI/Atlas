define(['knockout'], function (ko) {

    function SetSelect(sets, annotationView, cohortId, personId, sourceKey, sampleName) {
      var self = this;
      self.currentSet = ko.observable({});
      self.currentSetId = ko.observable();
      self.currentSet.subscribe((set) => {
        self.currentSetId(set.id);
        localStorage.setItem('currentSetId', set.id);
        annotationView.initContent(set, cohortId, personId, sourceKey, sampleName);
        annotationView.initNavigation(sampleName, cohortId, personId, sourceKey);
      });
      self.sets = ko.observableArray(sets);
  
  
      self.initialize = function(sets) {
        const currentSetIdFromLocalStorage = localStorage.getItem('currentSetId');
        if (currentSetIdFromLocalStorage) {
          const foundCurrentSet = ko.utils.arrayFirst(sets(), function(set) {
            return set.id == currentSetIdFromLocalStorage;
          })
          foundCurrentSet ? self.currentSet(foundCurrentSet) : self.currentSet(sets()[0]);
        } else {
          self.currentSet(sets()[0]);
        }
      }
  
      self.initialize(self.sets);
    }
  
    SetSelect.prototype.constructor = SetSelect;
  
      return SetSelect;
  });