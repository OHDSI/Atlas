define([
	'knockout',
], function (
	ko,
) {
  class Component {
    constructor() {
      this.createViewModel = this.createViewModel.bind(this);
    }

    render(params) {
      // This method should be extended
    }

    createViewModel(params, info) {
      return this.render(params, info);
    }
  }

  return Component;
});
