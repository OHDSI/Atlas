define([
	'knockout',
	'text!./treemap.html',
  'pages/data-sources/classes/Treemap',
  'providers/Component',
  'pages/data-sources/const',
  'components/heading',
  'components/charts/treemap',
  'pages/data-sources/components/reports/treemapDrilldown',
], function (
	ko,
	view,
  TreemapReport,
  Component,
  helpers
) {
	class Visit extends TreemapReport {
    static get name() {
      return 'visit';
    }

    static get view() {
      return view;
    }

    constructor(params) {
      super(params);
       
      
      this.aggProperty = helpers.aggProperties.byPerson;
    }

  }

  return Component.build(Visit);
});
