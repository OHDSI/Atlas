define([
	'knockout',
	'services/Vocabulary',
	'conceptsetbuilder/InputTypes/ConceptSet',
], function (
	ko,
	VocabularyAPI,
	ConceptSet,
) {

	function conceptSetSelectionHandler(conceptSets, context, selection, source) {

		return VocabularyAPI.getConceptSetExpression(selection.id, source.url).then((result) => {
			const newId = conceptSets().length > 0 ? Math.max(...conceptSets().map(c => c.id)) + 1 : 0;
			const newConceptSet = new ConceptSet({
				id: newId,
				name: selection.name,
				expression: result
			});
			conceptSets([...conceptSets(), newConceptSet]);
			context.conceptSetId(newConceptSet.id);
		});

	}

	return {
		conceptSetSelectionHandler,
	};
});