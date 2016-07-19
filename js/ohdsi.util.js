define(['jquery','knockout'], function($,ko) {
	
	var utilModule = { version: '1.0.0' };
	
	// private functions 	
	function _pruneJSON(key, value) {
		if (value === 0 || value) {
			return value;
		} else {
			return
		}
	}
	
	// END private functions
	
	// module functions
	function dirtyFlag(root, isInitiallyDirty) {
		var result = function () {},
			_initialState = ko.observable(ko.toJSON(root, _pruneJSON)),
			_isInitiallyDirty = ko.observable(isInitiallyDirty);

		result.isDirty = ko.pureComputed(function () {
			return _isInitiallyDirty() || _initialState() !== ko.toJSON(root, _pruneJSON);
		}).extend({
			rateLimit: 200
		});;

		result.reset = function () {
			_initialState(ko.toJSON(root, _pruneJSON));
			_isInitiallyDirty(false);
		};

		return result;
	}	

	
	// END module functions
	
	utilModule.dirtyFlag = dirtyFlag;
	
	return utilModule;
	
});