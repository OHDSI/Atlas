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
        if (isPageForeground()) {
          return this.start(null, { callback, interval, args });
        }
    }

    start(id, opts) {
      if (!!id && callbacks.has(id)) {
        const { callback, interval, args } = callbacks.get(id);
        return setTimeout(() => callback(args), interval);
      } else  {
        const { callback, interval, args } = opts;
        const id = setTimeout(() => callback(args), interval);
        callbacks.set(id, { callback, interval, args });
        return id;
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
