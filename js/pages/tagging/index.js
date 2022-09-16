define(
  (require) => {
    const ko = require('knockout');
    const buildRoutes = require('./routes');
    const appConfig = require('config/app');

    return {
      title: ko.i18n('navigation.tagging', 'Tagging'),
      buildRoutes,
      navUrl: () => '#/tagging',
      icon: 'tags',
	  statusCss: () => '',
      hidden: !appConfig.enableTaggingSection
    };
  }
);