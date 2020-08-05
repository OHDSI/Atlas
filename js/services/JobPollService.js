define([
  'knockout',
  'services/Poll',
  'atlas-state',
], function (
  ko,
  Poll,
  sharedState,
) {
  class JobPollService extends Poll.PollServiceClass {

    constructor() {
      super();
      this.isJobListMutated = ko.observable();
      this.isJobListMutated.extend({ notify: 'always' });
    }

    extraActionsAfterCallback() {
      sharedState.jobListing.valueHasMutated();
    }
  }
    return new JobPollService();
});