define(['knockout'], function(ko){

  function toConceptSetItems(selectedConcepts){
    var conceptSetItems = [];

    for (var i = 0; i < selectedConcepts.length; i++) {
      var item = selectedConcepts[i];
      conceptSetItems.push({
        conceptId: item.concept.CONCEPT_ID,
        isExcluded: +item.isExcluded(),
        includeDescendants: +item.includeDescendants(),
        includeMapped: +item.includeMapped()
      });
    }
    return conceptSetItems;
  }

  return {
    toConceptSetItems,
  };
});