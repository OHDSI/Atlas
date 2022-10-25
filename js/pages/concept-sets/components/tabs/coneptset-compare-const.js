define([], function () {

    const expressionType =  {
        BRIEF: 'BRIEF',
        FULL: 'FULL'
    };
    const requiredHeader = ['concept_name', 'concept_name', 'vocabulary_id'];

    return {
        requiredHeader,
        expressionType
    };
});