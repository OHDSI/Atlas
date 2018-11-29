define([ 'numeral' ], function(
	numeral,
){

	const formatStdDiff = (val) => numeral(val).format('0,0.0000');

	const formatPct = (val) => numeral(val).format('0.00') + '%';

	return {
		formatPct,
		formatStdDiff,
	};
});