define(['knockout', './Set', './Result', 'services/Annotation'], function (ko, Set, Result, annotationService) {

  function Annotation(set, subjectId, cohortId, sourceKey, rawResults, annotationId) {
    var self = this;
    self.set = new Set(set);
    self.setId = set.id;
    self.annotationId = ko.observable(annotationId);
    self.subjectId = subjectId;
    self.cohortId = cohortId;
    self.sourceKey = sourceKey;

    self.rawToForm = function(rawResults) {
      return rawResults.sort((a, b) => b.questionId - a.questionId).sort().reduce((accumulator, current) => {
          const length = accumulator.length
          if (length === 0 || accumulator[length - 1].questionId !== current.questionId) {
            if (current.type == 'MULTI_SELECT') {
              current.value = [current.value];
            }
            accumulator.push(current);
          } else {
            accumulator[length-1].value.push(current.value);
          }
          return accumulator;
      }, []);
    }

    self.formToRaw = function(massagedResults, questions) {
      return Object.keys(massagedResults).reduce((accumulator, current) => {
        switch(massagedResults[current].type) {
          case 'MULTI_SELECT': {
            massagedResults[current].value.forEach(value => {
              var answerId = _.find(_.find(questions, {id: massagedResults[current].questionId}).answers, {value: value}).id;
              var result = {
                ...massagedResults[current],
                value: value,
                answerId: answerId,
                annotationId: self.annotationId,
                setId: self.setId
              }
              accumulator.push(result);
            });
            return accumulator;
          }
          case 'SINGLE_SELECT': {
            if (!massagedResults[current].value) {
              return accumulator;
            }
            var answerId = _.find(_.find(questions, {id: massagedResults[current].questionId}).answers, {value: massagedResults[current].value}).id;
            var result = {
              ...massagedResults[current],
              answerId: answerId,
              annotationId: self.annotationId,
              setId: self.setId
            }
            accumulator.push(result);
            return accumulator;
          }
          default: {
            var answerId = _.find(questions, {id: massagedResults[current].questionId}).answers[0].id;
            var result = {
              ...massagedResults[current],
              answerId: answerId,
              annotationId: self.annotationId,
              setId: self.setId
            };
            accumulator.push(result);
            return accumulator;
          }
        }
      }, []);
    }

    var massagedResults = self.rawToForm(rawResults);

    self.results = ko.toJS(self.set.questions).reduce((accumulator, current) => {
      accumulator['question_'+current.id] = new Result(_.find(massagedResults, {questionId: current.id}) || { questionId: current.id, type: current.type });
      return accumulator;
    }, {});

    self.createOrUpdate = function(annotation) {
      var { results, set } = ko.toJS(annotation);
      var payload = {
        id: annotationId,
        subjectId: subjectId,
        cohortId: cohortId,
        setId: set.id,
        results: [
          ...self.formToRaw(results, set.questions)
        ]
      };
      annotationService.createOrUpdateAnnotation(payload)
        .then((annotation) => {
          this.annotationId(annotation.id);
        });
    }
  }

  Annotation.prototype.constructor = Annotation;

	return Annotation;
});
