define([
  'knockout',
	'text!./terms-and-conditions.html',
  'providers/Component',
  'providers/AutoBind',
  'utils/CommonUtils',
  'utils/MomentUtils',
  'services/AuthService',
  'moment',
  'config',
  'less!./terms-and-conditions.less',
  'components/modal'
], function (
  ko,
	view,
  Component,
  AutoBind,
  commonUtils,
  momentUtils,
  AuthService,
  momentjs,
  appConfig,
) {
	class TermsAndConditions extends AutoBind(Component) {
		constructor(params) {
      super(params);
      this.isModalShown = ko.pureComputed({
        read: () => {
          return AuthService.isAuthenticated() && !this.isAccepted();
        },
        write: (value) => {
          return false;
        }
      });
      this.title = appConfig.termsAndConditions.header;
      this.description = appConfig.termsAndConditions.description;
      this.content = appConfig.termsAndConditions.content;
      this.isAccepted = ko.observable(true);

      params.model.currentView.subscribe(() => {
        this.isAccepted(this.checkAcceptance());
      });
    }
    
    checkAcceptance() {
      const acceptanceDate = localStorage.getItem('terms-and-conditions-acceptance-date');
      if (acceptanceDate !== null) {
        const isExpired = momentUtils.diffInDays(parseInt(acceptanceDate, 10), momentjs().add(appConfig.termsAndConditions.acceptanceExpiresInDays, 'days')) <= 0;
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
