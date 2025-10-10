define([ 'numeral' , './const',], function(
	numeral,
	constants
){

	const formatStdDiff = (val) => numeral(val).format('0,0.0000');

	const formatPct = (val) => numeral(val).format('0.00') + '%';

	const colorHorizontalBoxplot = [
		"#ff9315",
		"#0d61ff",
		"gold",
		"blue",
		"green",
		"red",
		"black",
		"orange",
		"brown",
		"grey",
		"slateblue",
		"grey1",
		"darkgreen"
	];

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
		formatPct,
		formatStdDiff,
		colorHorizontalBoxplot,
		sortedStrataNames,
		extractMeaningfulCovName
	};
});