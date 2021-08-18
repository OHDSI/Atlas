define([], function () {

	function translateException(e) {
		if (e && e.status === 403) {
			return "You have insufficient permissions!";
		}
		return "Oops, Something went wrong!";
	}

	function extractServerMessage(e) {
		if (e.data && e.data.payload) {
			return `${e.data.payload.message}`;
		} else {
			return 'Error! Please see server logs for details.'
		}
	}

	return {
		translateException,
		extractServerMessage
	}
});