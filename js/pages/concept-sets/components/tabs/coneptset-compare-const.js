define([], function () {

    const expressionType =  {
        BRIEF: 'CONCEPT_NAME_CODE_AND_VOCABULARY_ID_ONLY',
        FULL: 'FULL'
    };
    const requiredHeader = ['concept_name', 'concept_name', 'vocabulary_id'];

    return {
        requiredHeader,
        expressionType
    };
});