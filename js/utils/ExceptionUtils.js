define([], function () {

	function translateException(e) {
		if (e && e.status === 403) {
			return "You have insufficient permissions!";
		}
		return "Oops, Something went wrong!";
	}

	return {
		translateException,
	}
});