define(['knockout', 'appConfig', 'webapi/AuthAPI', 'webapi/ConceptSetAPI', 'text!./components/conceptsetmodal/conceptSetSaveModal.html',
    'css!./components/conceptsetmodal/style.css'],
  function(ko, config, authApi, conceptSetApi, view){
    function ConceptSetSaveModal(params){
      var self = this;
      self.conceptSetName = params.conceptSetName;
      self.onSave = params.onSave;
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
        conceptSetApi.exists(self.conceptSetName())
          .then(function(data){
            self.isNameVerified(true);
            self.isNameUnique(!data || data.length === 0);
          }, function(){
            self.isNameVerified(false);
            self.isNameUnique(false);
          });
      });
    }

    var component = {
      viewModel: ConceptSetSaveModal,
      template: view,
    };
    ko.components.register('conceptset-save', component);
  }
);
