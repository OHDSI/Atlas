define([
  'knockout',
  'atlas-state',
	'text!./terms-and-conditions.html',
  'components/Component',
  'utils/AutoBind',
  'utils/CommonUtils',
  'services/MomentAPI',
  'services/AuthAPI',
  'pages/Router',
  'appConfig',
  'less!./terms-and-conditions.less',
  'components/modal'
], function (
  ko,
  state,
	view,
  Component,
  AutoBind,
  commonUtils,
  momentApi,
  authApi,
  router,
  appConfig
) {
	class TermsAndConditions extends AutoBind(Component) {
		constructor(params) {
      super(params);

      this.availableLocales = state.availableLocales;
      this.locale = state.locale;

      this.isModalShown = ko.pureComputed({
        read: () => {
          return appConfig.enableTermsAndConditions && !this.isAccepted();
        },
        write: (value) => {
          return false;
        }
      });

      this.title = ko.i18n('licenseAgreement.title', 'License Agreement');
      this.description = ko.i18n('licenseAgreement.description', 'In order to use the SNOMED International SNOMED CT Browser and HemOnc, please accept the following license agreement:');
      this.content = ko.observable();
      this.adaptContentToLocaleChange(ko.unwrap(state.locale));

      state.locale.subscribe(this.adaptContentToLocaleChange);

      this.isAccepted = ko.observable(true);

      router.currentView.subscribe(() => {
        this.isAccepted(this.checkAcceptance());
      });
    }

    adaptContentToLocaleChange(locale) {
        const availableLocales = state.availableLocales();
        if (availableLocales.length > 1) {
            this.content(appConfig.termsAndConditions.contents[locale] || appConfig.termsAndConditions.contents.en);
        } else {
            this.content(appConfig.termsAndConditions.contents.en);
        }
    }

    checkAcceptance() {
      const acceptanceDate = localStorage.getItem('terms-and-conditions-acceptance-date');
      if (acceptanceDate !== null) {
        const isExpired = momentApi.diffInDays(parseInt(acceptanceDate, 10), Date.now()) >= appConfig.termsAndConditions.acceptanceExpiresInDays;
        return !isExpired;
      }
      return false;
    }

    accept() {
      localStorage.setItem('terms-and-conditions-acceptance-date', Date.now());
      this.isAccepted(true);
    }

    reject() {
      alert(ko.i18n('licenseAgreement.rejectWarning', 'Without accepting this terms & conditions you can\'t use Atlas')());
    }
	}

	return commonUtils.build('terms-and-conditions', TermsAndConditions, view);
});
