define(['knockout'], function(ko){

  function toConceptSetItems(selectedConcepts){
    const conceptSetItems = [];

    for (let i = 0; i < selectedConcepts.length; i++) {
      const item = selectedConcepts[i];
      conceptSetItems.push({
        conceptId: item.concept.CONCEPT_ID,
        isExcluded: +ko.unwrap(item.isExcluded),
        includeDescendants: +ko.unwrap(item.includeDescendants),
        includeMapped: +ko.unwrap(item.includeMapped),
      });
    }
    return conceptSetItems;
  }

  return {
    toConceptSetItems,
  };
});