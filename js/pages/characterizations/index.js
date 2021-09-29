define(
	(require, exports) => {
		const ko = require('knockout');
		const sharedState = require('atlas-state');
		const constants = require('./const');
		const buildRoutes = require('./routes');

		const statusCss = ko.pureComputed(() => {
			if (sharedState.CohortCharacterization.current()) {
				return sharedState.CohortCharacterization.dirtyFlag().isDirty() ? "unsaved" : "open";
			}
			if (sharedState.FeatureAnalysis.current()) {
				return sharedState.FeatureAnalysis.dirtyFlag().isDirty() ? "unsaved" : "open";
			}
			return "";
		});

		const navUrl = ko.pureComputed(function () {
			let url = "#/cc/characterizations";
			if (sharedState.CohortCharacterization.current()) {
				url = url + `/${(sharedState.CohortCharacterization.current().id || 0)}`;
			} else if (sharedState.FeatureAnalysis.current()) {
				url = `#/cc/feature-analyses/${(sharedState.FeatureAnalysis.current().id || 0)}`;
			}
 			return url;
		});

    return {
      title: ko.i18n('navigation.characterizations', constants.pageTitle()),
      buildRoutes,
      icon: 'chart-line',
      statusCss,
			navUrl,
    };
  }
);