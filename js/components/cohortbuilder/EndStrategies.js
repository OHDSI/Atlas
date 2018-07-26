define(function (require, exports) {

	var DateOffset = require("./EndStrategies/DateOffsetStrategy");
	var CustomEra = require("./EndStrategies/CustomEraStrategy");
	
	function GetStrategyFromObject(data, conceptSets)
	{
		var result;
		
		if (data.hasOwnProperty("DateOffset")) {
			return {
				DateOffset: new exports.DateOffset(data.DateOffset, conceptSets)
			};
		} else if (data.hasOwnProperty("CustomEra")) {
			return {
				CustomEra: new exports.CustomEra(data.CustomEra, conceptSets)
			};
		};
	}
	
	exports.DateOffset = DateOffset;
	exports.CustomEra = CustomEra;
	
	exports.GetStrategyFromObject = GetStrategyFromObject;

});