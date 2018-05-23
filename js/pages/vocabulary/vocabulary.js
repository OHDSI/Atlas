define([
	'knockout',
	'atlas-state',
	'text!./vocabulary.html',
	'appConfig',
	'webapi/AuthAPI',
	'providers/Component',
	'components/tabs',
	'components/tab',
	'less!./vocabulary.less',
], function (
	ko,
	sharedState,
	view,
	config,
	authApi,
	Component
) {
	class Vocabulary extends Component {
		constructor() {
			super();
			this.name = 'vocabulary';
			this.view = view;
		}

		render(params) {
      super.render(params);
			return this;
		}
	}

	const component = new Vocabulary();
	return component.build();
});
