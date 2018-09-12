define([
  'knockout',
	'text!./terms-and-conditions.html',
  'providers/Component',
  'providers/AutoBind',
  'utils/CommonUtils',
  'webapi/MomentAPI',
  'moment',
  'config/terms-and-conditions.config',
  'less!./terms-and-conditions.less',
  'components/modal'
], function (
  ko,
	view,
  Component,
  AutoBind,
  commonUtils,
  momentApi,
  momentjs,
  termsAndConditionsConfig,
) {
	class TermsAndConditions extends AutoBind(Component) {
		constructor(params) {
      super(params);
      this.isModalShown = ko.pureComputed({
        read: () => {
          return !this.isAccepted();
        },
        write: (value) => {
          return false;
        }
      });
      this.title = termsAndConditionsConfig.header;
      this.description = termsAndConditionsConfig.description;
      this.content = termsAndConditionsConfig.content;
      this.isAccepted = ko.observable(true);
      
      setTimeout(() => {
        this.isAccepted(this.checkAcceptance());
      }, 300);
    }
    
    checkAcceptance() {
      const acceptanceDate = localStorage.getItem('terms-and-conditions-acceptance-date');
      if (acceptanceDate !== null) {
        const isExpired = momentApi.diffInDays(parseInt(acceptanceDate, 10), momentjs().add(termsAndConditionsConfig.acceptanceExpiresInDays, 'days')) <= 0;
        return !isExpired;
      }
      return false;
    }

    accept() {
      localStorage.setItem('terms-and-conditions-acceptance-date', Date.now());
      this.isAccepted(true);
    }

    reject() {
      alert('Without accepting this terms & conditions you can\'t use Atlas');
    }
	}

	return commonUtils.build('terms-and-conditions', TermsAndConditions, view);
});
