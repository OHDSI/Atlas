define([], function () {

	var options = {};
	options.dayOptions = ['0', '1', '7', '14', '21', '30', '60', '90', '120', '180', '365', '548', '730', '1095'];
	options.sampleSizeOptions = ['1000', '5000', '10000', '50000', '100000'];
	options.delCovariatesSmallCount = ['5', '10', '15', '20', '25', '50', '75', '100', '150', '200', '500'];
	options.yesNoOptions = [{
		name: "Yes",
		id: "1"
		}, {
		name: "No",
		id: "0"
		}];

	return options;
});
