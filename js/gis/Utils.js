"use strict";

define([], () => {

	function getAuthToken() {
		return localStorage.bearerToken;
	}

	async function httpQuery(url) {
		const headers = new Headers({
			'Authorization': `Bearer ${getAuthToken()}`,
		});

		const request = new Request(url, {
			method: 'GET',
			headers,
		});

		const response = await fetch(request);
		const result = await response.json();

		return result;
	}

	function addQueryParams(url, params) {
		const queryLine = Object.keys(params).reduce((acc, key) => {
			return (acc ? (acc + "&") : "") + key + "=" + params[key];
		}, "");
		return url + (url.includes("?") ? "&" : "?") + queryLine;
	}

	return {
		httpQuery,
		addQueryParams,
	}
});


