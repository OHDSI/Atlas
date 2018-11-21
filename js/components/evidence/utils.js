define(['knockout'], function(ko){

    function hasEvidence(row){
        return (
            row.descendantPmidCount > 0 ||
            row.exactPmidCount > 0 ||
            row.parentPmidCount > 0 ||
            row.ancestorPmidCount > 0 ||
            row.descendantSplicerCount > 0 ||
            row.exactSplicerCount > 0 ||
            row.parentSplicerCount > 0 ||
            row.ancestorSplicerCount > 0
        )
    }
  
    return {
      hasEvidence,
    };
  });