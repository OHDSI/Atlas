define([ 'numeral' ], function(
	numeral,
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

	return {
		formatPct,
		formatStdDiff,
		colorHorizontalBoxplot
	};
});