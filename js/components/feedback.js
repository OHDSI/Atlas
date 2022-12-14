define(['knockout', 'text!./feedback.html', 'appConfig'], function (ko, view, config) {
  function feedback() {
    var self = this;
    self.supportMail = config.supportMail;
    self.supportMailRef = "mailto:" + config.supportMail;
    self.contacts = config.feedbackContacts;
    self.feedbackTemplate = config.feedbackCustomHtmlTemplate;
  }
  var component = {
    viewModel: feedback,
    template: view,
  };

  ko.components.register('feedback', component);
  return component;
});