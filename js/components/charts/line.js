define([
	'knockout',
  'providers/Chart',
  'providers/Component',
  'atlascharts',
  'text!components/charts/chart.html',
  'const'
], function (
  ko,
  Chart,
  Component,
  atlascharts,
  view,
  helpers
) {
  class Line extends Chart {
    constructor(params) {
      super(params);
      this.renderer = new atlascharts.line();
    }
  }

  return helpers.build(Line, 'atlasline', view);
});
