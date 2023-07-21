const settingsObject = {
	baseUrl: 'js',
	waitSeconds: 0, // this will be overridden in the compiled file
	config: {
		text: {
			useXhr: function (url, protocol, hostname, port) {
				return true;
			}
		},
	},
	packages: [{
			name: "databindings",
			location: "extensions/bindings"
		},
		{
			name: "cohortdefinitionviewer",
			location: "components/cohortdefinitionviewer"
		},
		{
			name: "circe",
			location: "components/circe"
		},
		{
			name: "cyclops",
			location: "components/cyclops"
		},
		{
			name: "evidence",
			location: "components/evidence"
		},
		{
			name: "extenders",
			location: "extenders"
		},
		{
			name: "featureextraction",
			location: "components/featureextraction"
		},
		{
			name: "pages",
			location: "pages",
		},
		{
			name: "lodash",
			location: "../node_modules/lodash",
			main: "lodash",
		},
		{
			name: "urijs",
			location: "../node_modules/urijs/src",
			main: "URI"
		},
		{
			name: "utilities",
			location: "components/utilities",
		},
		{
			name: "facets",
			location: "../node_modules/facets",
			main: "facets"
		},
		{
			name: "bootstrap-datetimepicker.css",
			location: "../node_modules/bootstrap-datetimepicker/src/less",
			main: "less!bootstrap-datetimepicker.less",
		},
	],
	shim: {
		"colorbrewer": {
			exports: 'colorbrewer'
		},
		"bootstrap": {
			"deps": [
				'jquery'
			]
		},
		"prism": {
			exports: "Prism"
		},
		"prismlanguages/prism-sql": {
			deps: ["prism"]
		},
		"xss": {
			exports: "filterXSS"
		},
	},
	map: {
		"*": {
			'jqueryui/jquery.ddslick': 'assets/jqueryui/jquery.ddslick',
			'jqueryui/autoGrowInput': 'assets/jqueryui/autoGrowInput',
			'd3-color': 'd3',
			'd3-interpolate': 'd3',
			'd3-selection': 'd3',
			'd3-transition': 'd3',
			'd3-collection': 'd3',
			'services/VocabularyProvider': 'services/Vocabulary',
		}
	},
	paths: {
		"jquery": "../node_modules/jquery/dist/jquery",
		"jquery-ui": "../node_modules/jquery-ui",
		"bootstrap": "../node_modules/bootstrap/dist/js/bootstrap",
		"text": "extensions/plugins/text",
		"less": "extensions/plugins/less",
		"optional": "extensions/plugins/optional",
		"clipboard": "../node_modules/clipboard/dist/clipboard",
		"knockout": "../node_modules/knockout/build/output/knockout-latest",
		"ko.sortable": "../node_modules/knockout-sortable/src/knockout-sortable",
		"knockout-mapping": "../node_modules/knockout-mapping/dist/knockout.mapping",
		"datatables": "../node_modules/datatables/media/js/jquery.dataTables",
		"datatables.net": "../node_modules/datatables.net/js/jquery.dataTables",
		"datatables.net-buttons": "../node_modules/datatables.net-buttons/js/dataTables.buttons",
		"datatables.net-buttons-html5": "../node_modules/ouanalyse-datatables.net-buttons-html5/js/buttons.html5",
		"datatables.net-select": "../node_modules/datatables.net-select/js/dataTables.select",
		"colvis": "../node_modules/datatables.net-buttons/js/buttons.colVis",
		"crossfilter": "../node_modules/crossfilter2/crossfilter",
		"director": "../node_modules/director/build/director",
		"atlascharts": "../node_modules/@ohdsi/atlascharts/dist/atlascharts",
		"jnj_chart": "assets/jnj.chart", // scatterplot is not ported to separate library
		"lscache": "../node_modules/lscache/lscache",
		"localStorageExtender": "assets/localStorageExtender",
		"appConfig": "config",
		"prism": "../node_modules/prismjs/prism",
		"prismlanguages": "../node_modules/prismjs/components",
		"papaparse": "../node_modules/papaparse/papaparse",
		"js-cookie": "../node_modules/js-cookie/src/js.cookie",
		"d3": "../node_modules/d3/build/d3",
		"d3-tip": "../node_modules/d3-tip/dist/index",
		"d3-slider": "assets/d3.slider",
		"d3-scale-chromatic": "assets/d3-scale-chromatic.1.3.0.min",
		"xss": "../node_modules/xss/dist/xss",

		"moment": "../node_modules/moment/moment",
		"querystring": "../node_modules/qs/dist/qs",

		"bootstrap-select": "../node_modules/bootstrap-select/dist/js/bootstrap-select",
		"less-js": "../node_modules/less/dist/less",
		"file-saver": "../node_modules/file-saver/FileSaver",
		"svgsaver": "../node_modules/svgsaver/browser",
		"jszip": "../node_modules/jszip/dist/jszip.min",
		"numeral": "../node_modules/numeral/numeral",
		"lz-string": "../node_modules/lz-string/libs/lz-string",
		"colorbrewer": "../node_modules/colorbrewer/index",
		"ohdsi-api": "../node_modules/@ohdsi/ui-toolbox/lib/umd/api/index",
		"bootstrap-datetimepicker": "../node_modules/eonasdan-bootstrap-datetimepicker/build/js/bootstrap-datetimepicker.min",
		"visibilityjs": "../node_modules/@ohdsi/visibilityjs/lib/visibility.core",
		"ajv": "../node_modules/ajv/dist/ajv.bundle",
		"hash-it": "../node_modules/hash-it/dist/hash-it.min",
		"leaflet": "../node_modules/leaflet/dist/leaflet",
		"html2canvas": "../node_modules/html2canvas/dist/html2canvas.min",
		"venn": "../node_modules/venn.js/venn"
	},
	cssPaths: {
		"font-awesome.min.css": "css!styles/font-awesome.min.css",
		"bootstrap.min.css": "css!styles/bootstrap.min.css",
		"bootstrap-datetimepicker.min.css": "css!../node_modules/eonasdan-bootstrap-datetimepicker/build/css/bootstrap-datetimepicker.min.css",
		"bootstrap-theme.min.css": "css!styles/bootstrap-theme.min.css",
		"jquery.dataTables.min.css": "css!styles/jquery.dataTables.min.css",
		"tabs.css": "css!styles/tabs.css",
		"jquery-ui.css": "css!styles/jquery-ui.css",
		"buttons.dataTables.min.css": "css!styles/buttons.dataTables.min.css",
		"atlas.css": "css!styles/atlas.css",
		"chart.css": "css!styles/chart.css",
		"achilles.css": "css!styles/achilles.css",
		"bootstrap-select.min.css": "css!../node_modules/bootstrap-select/dist/css/bootstrap-select.css",
		"buttons.css": "css!styles/buttons.css",
		"cartoon.css": "css!styles/cartoon.css",
		"d3.slider.css": "css!styles/d3.slider.css",
		"exploreCohort.css": "css!styles/exploreCohort.css",
		"jquery.dataTables.colVis.css": "css!styles/jquery.dataTables.colVis.css",
		"jquery.datatables.tabletools.css": "css!styles/jquery.datatables.tabletools.css",
		"prism.css": "css!styles/prism.css",
        "leaflet": "css!../node_modules/leaflet/dist/leaflet.css"
	},
	localRefs: {
		"configuration": "components/configuration",
		"conceptset-editor": "components/conceptset/conceptset-editor",
		"conceptset-modal": "components/conceptsetmodal/conceptSetSaveModal",
		"user-bar": "components/userbar/user-bar",
		"faceted-datatable": "components/faceted-datatable",
		"r-manager": "components/r-manager",
		"home": "components/home",
		"welcome": "components/welcome",
		"forbidden": "components/ac-forbidden",
		"unauthenticated": "components/ac-unauthenticated",
		"roles": "components/roles",
		"role-details": "components/role-details",
		"loading": "components/loading",
		"atlas-state": "components/atlas-state",
		"feedback": "components/feedback",
		"conceptpicker": "components/conceptpicker",
		"css": "extensions/plugins/css",
	},
};

if (typeof define !== 'undefined') {
	define(() => settingsObject);
} else {
	module.exports = settingsObject;
}