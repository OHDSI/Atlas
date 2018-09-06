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
      name: "evidence",
      location: "components/evidence"
    },
    {
      name: "extenders",
      location: "extenders"
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
    }
  },
  map: {
    "*": {
      'jquery-ui/ui/widgets/sortable': 'jquery-ui',
      'jquery-ui/ui/widgets/draggable': 'jquery-ui',
      'jquery-ui/ui/widgets/droppable': 'jquery-ui',
      'jquery-ui/dialog': 'jquery-ui',
      'jquery-ui/autocomplete': 'jquery-ui',
      'jquery-ui/tabs': 'jquery-ui',
      'jqueryui/jquery.ddslick': 'assets/jqueryui/jquery.ddslick',
      'jqueryui/autoGrowInput': 'assets/jqueryui/autoGrowInput',
    }
  },
  paths: {    
    "datatables.net-buttons": "assets/jquery.dataTables.buttons.min",
    "datatables.net-buttons-html5": "assets/jquery.dataTables.buttons.html5.min",
    "colvis": "assets/jquery.dataTables.colVis.min",
    "jnj_chart": "assets/jnj.chart", // scatterplot is not ported to separate library
    "localStorageExtender": "assets/localStorageExtender",
    "jquery.ui.autocomplete.scroll": "assets/jquery.ui.autocomplete.scroll",
    "facets": "assets/facets",
    "colorbrewer": "assets/colorbrewer",

    "jquery": "https://code.jquery.com/jquery-1.11.2.min",
		"clipboard": "https://cdnjs.cloudflare.com/ajax/libs/clipboard.js/2.0.1/clipboard.min",
    "knockout": "https://cdnjs.cloudflare.com/ajax/libs/knockout/3.4.2/knockout-min",
    "knockout-mapping": "https://cdnjs.cloudflare.com/ajax/libs/knockout.mapping/2.4.1/knockout.mapping.min",
    "datatables.net": "https://cdnjs.cloudflare.com/ajax/libs/datatables/1.10.19/js/jquery.dataTables.min",
    "director": "https://cdnjs.cloudflare.com/ajax/libs/Director/1.2.8/director.min",
    "lodash": "https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.10/lodash.min",
    "lscache": "https://cdnjs.cloudflare.com/ajax/libs/lscache/1.2.0/lscache.min",
    "prism": "https://cdnjs.cloudflare.com/ajax/libs/prism/1.15.0/prism.min",
    "file-saver": "https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/1.3.8/FileSaver.min",
    "numeral": "https://cdnjs.cloudflare.com/ajax/libs/numeral.js/2.0.6/numeral.min",
    "lz-string": "https://cdnjs.cloudflare.com/ajax/libs/lz-string/1.4.4/lz-string.min",
    
    "jquery-ui": "https://code.jquery.com/ui/1.11.4/jquery-ui.min",
    "bootstrap": "https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/3.3.7/js/bootstrap.min",
    "text": "plugins/text",
    "less": "plugins/less",
    "optional": "plugins/optional",
    "ko.sortable": "https://cdnjs.cloudflare.com/ajax/libs/knockout-sortable/1.1.0/knockout-sortable.min",
    "crossfilter": "https://cdnjs.cloudflare.com/ajax/libs/crossfilter2/1.4.1/crossfilter.min",
    "atlascharts": "https://unpkg.com/@ohdsi/atlascharts@1.4.1/dist/atlascharts.min",
    "appConfig": "config",
    "js-cookie": "https://cdnjs.cloudflare.com/ajax/libs/js-cookie/2.2.0/js.cookie.min",

    "d3": "https://cdnjs.cloudflare.com/ajax/libs/d3/4.10.0/d3.min",
    "d3-collection": "https://cdnjs.cloudflare.com/ajax/libs/d3-collection/1.0.4/d3-collection.min",
    "d3-selection": "https://cdnjs.cloudflare.com/ajax/libs/d3-selection/1.1.0/d3-selection.min",
    "d3-shape": "https://cdnjs.cloudflare.com/ajax/libs/d3-shape/1.2.0/d3-shape.min",
    "d3-drag": "https://cdnjs.cloudflare.com/ajax/libs/d3-drag/1.1.1/d3-drag.min",
    "d3-scale": "https://cdnjs.cloudflare.com/ajax/libs/d3-scale/1.0.6/d3-scale.min",
    "d3-array": "https://cdnjs.cloudflare.com/ajax/libs/d3-array/1.2.0/d3-array.min",
    "d3-interpolate": "https://cdnjs.cloudflare.com/ajax/libs/d3-interpolate/1.1.5/d3-interpolate.min",
    "d3-format": "https://cdnjs.cloudflare.com/ajax/libs/d3-format/1.2.0/d3-format.min",
    "d3-time": "https://cdnjs.cloudflare.com/ajax/libs/d3-time/1.0.7/d3-time.min",
    "d3-time-format": "https://cdnjs.cloudflare.com/ajax/libs/d3-time-format/2.0.5/d3-time-format.min",
    "d3-color": "https://cdnjs.cloudflare.com/ajax/libs/d3-color/1.0.3/d3-color.min",
    "d3-path": "https://cdnjs.cloudflare.com/ajax/libs/d3-path/1.0.5/d3-path.min",
    "d3-dispatch": "https://cdnjs.cloudflare.com/ajax/libs/d3-dispatch/1.0.3/d3-dispatch.min",
    "d3-tip": "https://cdnjs.cloudflare.com/ajax/libs/d3-tip/0.7.1/d3-tip.min",
    "d3-slider": "assets/d3.slider",
    "xss": "https://cdnjs.cloudflare.com/ajax/libs/js-xss/0.3.3/xss.min",

    "moment": "https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.19.2/moment.min",
    "querystring": "https://cdnjs.cloudflare.com/ajax/libs/qs/6.5.1/qs.min",

    "bootstrap-select": "https://cdnjs.cloudflare.com/ajax/libs/bootstrap-select/1.13.0-beta/js/bootstrap-select",
    "less-js": "https://cdnjs.cloudflare.com/ajax/libs/less.js/3.0.1/less.min",
    "ohdsi-api": "https://unpkg.com/@ohdsi/ui-toolbox@1.0.1/lib/umd/api/index",
    // needed for @ohdsi/ui-toolbox Api
    "urijs": "https://unpkg.com/urijs@1.19.1/src/URI",
    "punycode": "https://unpkg.com/urijs@1.19.1/src/punycode",
    "SecondLevelDomains": "https://unpkg.com/urijs@1.19.1/src/SecondLevelDomains",		
    "IPv6": "https://unpkg.com/urijs@1.19.1/src/IPv6",
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
    "plp.css": "styles/plp.css",
    "prism.css": "styles/prism.css",
  },
};

if (typeof define !== 'undefined') {
  define(() => settingsObject);
} else {
  module.exports = settingsObject;
}
