define([
  'knockout',
  'text!./name-validation.html',
  'components/Component',
  'utils/CommonUtils',
], function (
  ko,
  view,
  Component,
  commonUtils
) {
  class NameValidation extends Component {
    constructor(params) {
      super(params);
      this.hasEmptyName = params.hasEmptyName;
      this.hasInvalidCharacters = params.hasInvalidCharacters;
      this.hasInvalidLength = params.hasInvalidLength;
      this.hasDefaultName = params.hasDefaultName;
    }
  }

  return commonUtils.build('name-validation', NameValidation, view);
});