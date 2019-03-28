define([
	'text!./ir-definition.html',
	'components/Component',
	'utils/AutoBind',
	'utils/CommonUtils',
	'../components/iranalysis/main',
], function (
	view,
	Component,
	AutoBind,
	commonUtils,
) {
	class IRDefinitionTab extends AutoBind(Component) {
		constructor(params) {
      super(params);
      this.parent = params.parent;
    }
	}

	return commonUtils.build('ir-definition', IRDefinitionTab, view);
});