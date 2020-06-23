define([
  'knockout',
  'services/Poll',
  'atlas-state',
], function (
  ko,
  PollService,
  sharedState,
) {
  class JobPollService extends PollService {

    constructor() {
      super();
      this.isJobListMutated = ko.observable();
      this.isJobListMutated.extend({ notify: 'always' });
    }

    add(opts = {}, ...args) {
      return super.add(opts, args);
    }

    extraActionsAfterCallback() {
      sharedState.jobListing.valueHasMutated();
    }
  }
    return new JobPollService();
});