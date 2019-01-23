define(['knockout', 'visibilityjs'], (ko) => {
  const callbacks = new Map();
  
  const isPageForeground = ko.observable(Visibility.state() === "visible");
  Visibility.change((e, state) => {
    const isForeground = state === "visible";
    isPageForeground(isForeground);

    if (isForeground) {
      // when a user focuses tab, we shound immediately sync
      PollService.pollImmediately();
    }
  });

  class PollService {
    add(callback, interval = 1000, ...args) {
      const intervalId = setInterval(() => {
        if (isPageForeground()) {
          callback(args);
        }
      }, interval);
      callbacks.set(intervalId, { callback, args });
      
      return interval;
    }

    stop(intervalId) {
      clearInterval(intervalId);
      callbacks.delete(intervalId);
    }

    static pollImmediately() {
      for (let [intervalId, c] of callbacks) {
        c.callback(c.args);
      }
    }
  }

  return new PollService();
});
