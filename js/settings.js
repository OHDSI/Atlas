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
    "jquery": "https://code.jquery.com/jquery-1.11.2.min",
    "jquery-ui": "https://code.jquery.com/ui/1.11.4/jquery-ui.min",
    "bootstrap": "https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/3.3.7/js/bootstrap.min",
    "text": "extensions/plugins/text",
    "less": "extensions/plugins/less",
    "optional": "extensions/plugins/optional",
    "clipboard": "assets/clipboard.min",
    "knockout": "assets/knockout.min",
    "ko.sortable": "https://cdnjs.cloudflare.com/ajax/libs/knockout-sortable/1.1.0/knockout-sortable.min",
    "knockout-mapping": "assets/knockout.mapping",
    "datatables.net": "assets/jquery.dataTables.min",
    "datatables.net-buttons": "assets/jquery.dataTables.buttons.min",
    "datatables.net-buttons-html5": "assets/jquery.dataTables.buttons.html5.min",
    "colvis": "assets/jquery.dataTables.colVis.min",
    "crossfilter": "https://cdnjs.cloudflare.com/ajax/libs/crossfilter2/1.4.1/crossfilter.min",
    "director": "assets/director.min",
    "atlascharts": "https://unpkg.com/@ohdsi/atlascharts@1.5.0/dist/atlascharts.min",
    "jnj_chart": "assets/jnj.chart", // scatterplot is not ported to separate library
    "lodash": "assets/lodash.4.15.0.full",
    "lscache": "assets/lscache.min",
    "localStorageExtender": "assets/localStorageExtender",
    "appConfig": "config",
    "prism": "assets/prism",
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
    "d3-scale-chromatic": "assets/d3-scale-chromatic.1.3.0.min",
    "xss": "https://cdnjs.cloudflare.com/ajax/libs/js-xss/0.3.3/xss.min",

    "moment": "https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.19.2/moment.min",
    "querystring": "https://cdnjs.cloudflare.com/ajax/libs/qs/6.5.1/qs.min",

    "bootstrap-select": "https://cdnjs.cloudflare.com/ajax/libs/bootstrap-select/1.13.0-beta/js/bootstrap-select",
    "less-js": "https://cdnjs.cloudflare.com/ajax/libs/less.js/3.0.1/less.min",
    "file-saver": "https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/1.3.8/FileSaver.min",
    "numeral": "assets/numeral",
    "lz-string": "assets/lz-string",
    "jquery.ui.autocomplete.scroll": "assets/jquery.ui.autocomplete.scroll",
    "facets": "assets/facets",
    "colorbrewer": "assets/colorbrewer",
    "ohdsi-api": "https://unpkg.com/@ohdsi/ui-toolbox@1.0.2/lib/umd/api/index",
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
    "prism.css": "styles/prism.css",
  },
};

if (typeof define !== 'undefined') {
  define(() => settingsObject);
} else {
  module.exports = settingsObject;
}
