const settingsObject = {
  baseUrl: 'js',
  config: {
    text: {
      useXhr: function (url, protocol, hostname, port) {
        return true;
      }
    },
  },    
  packages: [{
      name: "databindings",
      location: "modules/databindings"
    },
    {
      name: "cohortdefinitionviewer",
      location: "components/cohortdefinitionviewer"
    },
    {
      name: "circe",
      location: "modules/circe"
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
      name: "job",
      location: "modules/job"
    },
    {
      name: "plp",
      location: "modules/plp"
    },
    {
      name: "pages",
      location: "pages",
    },
    {
      name: "jquery-ui",
      location: "../node_modules/jquery-ui",
      main: "ui/widget",
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
      "prism": {
        "exports": "Prism"
      }
    },
    "xss": {
      exports: "filterXSS"
    },
  },
  map: {
    "*": {
      'jquery-ui/dialog': 'jquery-ui',
      'jquery-ui/tabs': 'jquery-ui',
      'jqueryui/jquery.ddslick': 'assets/jqueryui/jquery.ddslick',
      'jqueryui/autoGrowInput': 'assets/jqueryui/autoGrowInput',
    }
  },
  paths: {    
    "jquery": "../node_modules/jquery/dist/jquery",
    "bootstrap": "../node_modules/bootstrap/dist/js/bootstrap",
    "text": "plugins/text",
    "less": "plugins/less",
    "optional": "plugins/optional",
    "clipboard": "../node_modules/clipboard/dist/clipboard",
    "knockout": "../node_modules/knockout/build/output/knockout-latest",
    "ko.sortable": "../node_modules/knockout-sortable/src/knockout-sortable",
    "knockout-mapping": "../node_modules/knockout-mapping/dist/knockout.mapping",
    "datatables": "../node_modules/datatables/media/js/jquery.dataTables",
    "datatables.net": "../node_modules/datatables.net/js/jquery.dataTables",
    "datatables.net-buttons": "../node_modules/datatables.net-buttons/js/dataTables.buttons",
    "datatables.net-buttons-html5": "../node_modules/ouanalyse-datatables.net-buttons-html5/js/buttons.html5",
    "colvis": "../node_modules/drmonty-datatables-colvis/js/dataTables.colVis",
    "crossfilter": "../node_modules/crossfilter2/crossfilter",
    "director": "../node_modules/director/build/director",
    "atlascharts": "../node_modules/@ohdsi/atlascharts/dist/atlascharts",
    "jnj_chart": "assets/jnj.chart", // scatterplot is not ported to separate library
    "lscache": "../node_modules/lscache/lscache",
    "localStorageExtender": "assets/localStorageExtender",
    "appConfig": "config",
    "prism": "../node_modules/prismjs/prism",
    "js-cookie": "../node_modules/js-cookie/src/js.cookie",

    "d3": "../node_modules/d3/build/d3",
    "d3-collection": "../node_modules/d3-collection/build/d3-collection",
    "d3-selection": "../node_modules/d3-selection/build/d3-selection",
    "d3-shape": "../node_modules/d3-shape/build/d3-shape",
    "d3-drag": "../node_modules/d3-drag/build/d3-drag",
    "d3-scale": "../node_modules/d3-scale/build/d3-scale",
    "d3-array": "../node_modules/d3-array/build/d3-array",
    "d3-interpolate": "../node_modules/d3-interpolate/build/d3-interpolate",
    "d3-format": "../node_modules/d3-format/build/d3-format",
    "d3-time": "../node_modules/d3-time/build/d3-time",
    "d3-time-format": "../node_modules/d3-time-buildt/2.0.5/d3-time-format",
    "d3-color": "../node_modules/d3-color/build/d3-color",
    "d3-path": "../node_modules/d3-path/build/d3-path",
    "d3-dispatch": "../node_modules/d3-dispatch/build/d3-dispatch",
    "d3-tip": "../node_modules/d3-tip/index",
    "d3-slider": "assets/d3.slider",
    "d3-scale-chromatic": "assets/d3-scale-chromatic.1.3.0.min",
    "xss": "../node_modules/xss/dist/xss",

    "moment": "../node_modules/moment/moment",
    "querystring": "https://cdnjs.cloudflare.com/ajax/libs/qs/6.5.1/qs",

    "bootstrap-select": "../node_modules/bootstrap-select/dist/js/bootstrap-select",
    "less-js": "../node_modules/less/dist/less",
    "file-saver": "../node_modules/file-saver/FileSaver",
    "numeral": "../node_modules/numeral/numeral",
    "lz-string": "assets/lz-string",
    "jquery.ui.autocomplete.scroll": "../node_modules/jquery-ui.autocomplete.scroll/jquery.ui.autocomplete.scroll.min",
    "facets": "../node_modules/facets/facets",
    "colorbrewer": "../node_modules/colorbrewer/index",
    "ohdsi-api": "../node_modules/@ohdsi/ui-toolbox/lib/umd/api/index",
  },
  cssPaths: {
    "font-awesome.min.css": "styles/font-awesome.min.css",
    "bootstrap.min.css": "styles/bootstrap.min.css",
    "bootstrap-theme.min.css": "styles/bootstrap-theme.min.css",
    "jquery.dataTables.min.css": "styles/jquery.dataTables.min.css",
    "tabs.css": "styles/tabs.css",
    "jquery-ui.css": "styles/jquery-ui.css",
    "buttons.dataTables.min.css": "styles/buttons.dataTables.min.css",
    "atlas.css": "styles/atlas.css",
    "chart.css": "styles/chart.css",
    "achilles.css": "styles/achilles.css",
    "bootstrap-select.min.css": "https://cdnjs.cloudflare.com/ajax/libs/bootstrap-select/1.13.1/css/bootstrap-select.min.css",
    "buttons.css": "styles/buttons.css",
    "cartoon.css": "styles/cartoon.css",
    "d3.slider.css": "styles/d3.slider.css",
    "exploreCohort.css": "styles/exploreCohort.css",
    "jquery.dataTables.colVis.css": "styles/jquery.dataTables.colVis.css",
    "jquery.datatables.tabletools.css": "styles/jquery.datatables.tabletools.css",
    "prism.css": "styles/prism.css",
  },
};

if (typeof define !== 'undefined') {
  define(() => settingsObject);
} else {
  module.exports = settingsObject;
}
