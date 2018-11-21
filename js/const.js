define([], function(){

const applicationStatuses = {
    initializing: 'initializing',
    complete: 'complete',
    noSourcesAvailable: 'no-sources-available',
    failed: 'failed',
    running: 'running',
};

    return {
        applicationStatuses,
    };
});