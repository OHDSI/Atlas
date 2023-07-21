define(['prismlanguages/prism-sql'], function () {

	function highlightJS(code, language) {
		if (!code) {
			return ;
		}
		if (typeof code === 'function') {
			return Prism.highlight(code(), Prism.languages[language], language);
		}
		return Prism.highlight(code, Prism.languages[language], language);
	}


	return highlightJS;

});