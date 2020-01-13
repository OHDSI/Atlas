define(['knockout', 'appConfig', 'services/AuthAPI', 'services/ConceptSet', 'components/Component',
    'utils/CommonUtils',
    'utils/AutoBind',
    'text!./components/conceptsetmodal/conceptSetSaveModal.html',
    'css!./components/conceptsetmodal/style.css'],
  function(ko, config, authApi, conceptSetService, Component, commonUtils, AutoBind, view){

    class ConceptSetSaveModal extends AutoBind(Component){

      constructor (params){
        super();

        this.conceptSetName = params.conceptSetName;
        this.show = params.show;
        this.fade = ko.observable(true);
        this.onSave = () => {
          this.fade(false);
          this.show && this.show(false);
          params.onSave();
        };

        this.isNameUnique = ko.observable(false);

        this.canCreate = ko.computed(() =>
          (authApi.isAuthenticated() && authApi.isPermittedCreateConceptset()) || !config.userAuthenticationEnabled
        );
        this.canSave = ko.computed(() => {
          this.checkName();
          return  this.canCreate() && this.conceptSetName() && this.conceptSetName().length > 0 && this.isNameUnique();
        }).extend({ notify: 'always' });
      }

      async checkName() {
        try {
          const data = await conceptSetService.exists(this.conceptSetName() === undefined ? '' : this.conceptSetName(), 0);
          this.isNameUnique(parseInt(data) === 0);
        } catch(e) {
          this.isNameUnique(false);
        }
      }
    }

    return commonUtils.build('conceptset-save', ConceptSetSaveModal, view);
  }
);
