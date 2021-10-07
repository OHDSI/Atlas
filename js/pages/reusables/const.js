define((require, exports) => {
	const getPageUrl = (id, section) => `/reusables/${id}/${section}`;

	return {
		getPageUrl,
	};
});
