define([
	'knockout',
	'services/Vocabulary',
	'conceptsetbuilder/InputTypes/ConceptSet',
	'./const',
], function (
	ko,
	VocabularyAPI,
	ConceptSet,
	constants,
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

	function extractMeaningfulCovName(fullName, faType = constants.feAnalysisTypes.CRITERIA) {
		if ([constants.feAnalysisTypes.CRITERIA, constants.feAnalysisTypes.CUSTOM_FE].includes(faType)) {
			return fullName;
		}
		let nameParts = fullName.split(":");
		if (nameParts.length < 2) {
			nameParts = fullName.split("=");
		}
		if (nameParts.length !== 2) {
			return fullName;
		} else {
			return nameParts[1];
		}
	}

	function sortedStrataNames(strataNames, filter = null) {
		return Array.from(strataNames).map(s => ({id: s[0], name: s[1]})).filter(s => !filter || s.id !== 0).sort((a,b) => a.id - b.id);
	}

	return {
		conceptSetSelectionHandler,
		extractMeaningfulCovName,
		sortedStrataNames,
	};
});