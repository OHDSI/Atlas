define([
	'text!./ir-conceptsets.html',
	'components/Component',
	'utils/AutoBind',
	'utils/CommonUtils',
], function (
	view,
	Component,
	AutoBind,
	commonUtils,
) {
	class IRConceptsetsTab extends AutoBind(Component) {
		constructor(params) {
      super(params);
      this.parent = params.parent;
    }
	}

	return commonUtils.build('ir-conceptsets', IRConceptsetsTab, view);
});