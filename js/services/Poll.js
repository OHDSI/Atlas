define(['knockout', 'visibilityjs'], (ko, Visibility) => {
  const callbacks = new Map();
  const isPageForeground = ko.observable(Visibility.state() === "visible");
  Visibility.change((e, state) => {
    const isForeground = state === "visible";
    isPageForeground(isForeground);

    if (isForeground) {
      // when a user focuses tab, we should immediately sync
      PollService.pollImmediately();
    }
  });

  class PollService {
    constructor(){
    }
    add(opts = {}, ...args) {
      const { callback = () => {}, interval = 1000, isSilentAfterFirstCall = false} = opts;
      const id = new Date().valueOf();
      callbacks.set(id, {
        callback,
        interval,
        isSilentAfterFirstCall,
        totalFnCalls: 0,
        args
      });
      this.start(id);
      return id;
    }

    async start(id) {
      if (callbacks.has(id)) {
        const cb = callbacks.get(id);
        const { callback, interval, isSilentAfterFirstCall, totalFnCalls, args } = cb;
        try {
          if (isPageForeground()) {
            const silently = isSilentAfterFirstCall && totalFnCalls > 0;
            await callback(silently);
            this.extraActionsAfterCallback();
            callbacks.set(id, { ...cb, totalFnCalls: totalFnCalls + 1 });
          }
        } catch(e) {
          console.log(e);
        } finally {
          setTimeout(() => this.start(id), interval);
        }
      }
    }

    extraActionsAfterCallback() {
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

  return {
    PollService: new PollService(),
    PollServiceClass: PollService,
  };
});
