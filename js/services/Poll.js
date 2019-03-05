define(['knockout', 'visibilityjs'], (ko, Visibility) => {
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
      const id = new Date().valueOf();
      callbacks.set(id, { callback, interval, args });
      this.start(id);
      return id;
    }

    async start(id) {
      if (callbacks.has(id)) {
        const { callback, interval, args } = callbacks.get(id);
        try {
          isPageForeground() && await callback();
        } catch(e) {
          console.log(e);
        } finally {
          setTimeout(() => this.start(id), interval);
        }
      }
    }

    stop(id) {
      callbacks.delete(id);
    }

    static pollImmediately() {
      for (let [id, c] of callbacks) {
        c.callback(c.args);
      }
    }
  }

  return new PollService();
});
