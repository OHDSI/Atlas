define(['knockout', 'appConfig', 'services/AuthAPI', 'services/ConceptSet', 'text!./components/conceptsetmodal/conceptSetSaveModal.html',
    'css!./components/conceptsetmodal/style.css'],
  function(ko, config, authApi, conceptSetService, view){
    function ConceptSetSaveModal(params){
      var self = this;
      self.conceptSetName = params.conceptSetName;
      self.onSave = params.onSave || function(){};
      self.show = params.show;
      self.isNameUnique = ko.observable(false);
      self.isNameVerified = ko.observable(false);

      self.canSave = ko.pureComputed(function(){
        return self.canCreate() && self.conceptSetName() && self.conceptSetName().length > 0 && self.isNameUnique();
      });
      self.canCreate = ko.computed(function () {
        return ((authApi.isAuthenticated() && authApi.isPermittedCreateConceptset()) || !config.userAuthenticationEnabled);
      });
      self.notUniqueName = ko.computed(function(){
        return self.isNameVerified() && !self.isNameUnique();
      });
      self.checkName = ko.computed(function () {
        conceptSetService.exists(self.conceptSetName() === undefined ? '' : self.conceptSetName(), 0)
          .then(({ data }) => {
            self.isNameVerified(true);
            self.isNameUnique(!data || data.length === 0);
          })
          .catch(() => {
            self.isNameVerified(false);
            self.isNameUnique(false);
          });
      });

      self.show.subscribe((show) => {
        if (show) {
          self.conceptSetName.valueHasMutated();
        }
      });
    }

    var component = {
      viewModel: ConceptSetSaveModal,
      template: view,
    };
    ko.components.register('conceptset-save', component);
  }
);
