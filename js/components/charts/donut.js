define([
	'knockout',
  'providers/Chart',
  'providers/Component',
  'atlascharts',
], function (
  ko,
  Chart,
  Component,
  atlascharts,
) {
  class Donut extends Chart {
    static get name() {
      return 'donut';
    }

    constructor(params) {
      super(params);
      this.chart = new atlascharts.donut();
    }

  }

  return Component.build(Donut);
});
