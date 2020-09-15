define([
	'knockout',
	'./const',
], function (
	ko,
	constants,
) {

	function extractMeaningfulCovName(fullName, faType = constants.feAnalysisTypes.CRITERIA) {
		if ([constants.feAnalysisTypes.CRITERIA_SET, constants.feAnalysisTypes.CUSTOM_FE].includes(faType)) {
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
		extractMeaningfulCovName,
		sortedStrataNames,
	};
});