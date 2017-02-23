({
	baseUrl: '../js',
	separateCSS: true,	
	mainConfigFile: '../js/main.js',
	optimize:'none',
	name: 'cohortbuilder',
	include: ['cohortbuilder/CohortDefinition'],
	exclude: ['text', 'css', 'databindings', 'conceptpicker/ConceptPicker','conceptsetbuilder/InputTypes/ConceptSet'],
	fileExclusionRegExp: '^.git$',
	out: '../dist/cohortbuilder.min.js'
});
