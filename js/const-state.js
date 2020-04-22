define([], () => {
  const applicationStatuses = {
    initializing: 'initializing',
    running: 'running',
    noSourcesAvailable: 'no-sources-available',
    failed: 'failed',
  };
  
  return {
    applicationStatuses,
  }
})