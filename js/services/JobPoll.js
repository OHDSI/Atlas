define([
  'knockout',
  'services/Poll',
], function (
  ko,
  PollService
) {
  class JobPoll extends PollService {
  
    constructor() {
      super();
      this.isJobListMutated = ko.observable();
      this.isJobListMutated.extend({ notify: 'always' });
      this.shouldMutateJobList = false;
    }
  
    add(shouldMutateJobList, opts = {}, ...args) {  
      this.shouldMutateJobList = shouldMutateJobList;
      return super.add(opts, args);
    }

    extraActionsAfterCallback() {
      this.isJobListMutated(this.shouldMutateJobList);
    }
  }
    return new JobPoll();
});