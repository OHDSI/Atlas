define([
  'knockout',
  'text!./name-validation.html',
  'components/Component',
  'utils/CommonUtils',
  'const'
], function (
  ko,
  view,
  Component,
  commonUtils,
  constants
) {
  class NameValidation extends Component {
    constructor(params) {
      super(params);
      this.maxEntityNameLength = constants.maxEntityNameLength;
      this.hasEmptyName = params.hasEmptyName;
      this.hasInvalidCharacters = params.hasInvalidCharacters;
      this.hasInvalidLength = params.hasInvalidLength;
      this.hasDefaultName = params.hasDefaultName;
    }
  }

  return commonUtils.build('name-validation', NameValidation, view);
});