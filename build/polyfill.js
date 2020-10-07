define(['../node_modules/@babel/polyfill/dist/polyfill'], () => {});

if (typeof Promise.prototype.done !== 'function') {
  Promise.prototype.done = function (onFulfilled, onRejected) {
    const self = arguments.length ? this.then.apply(this, arguments) : this;
    self.then(null, function (err) {
      setTimeout(function () {
        throw err
      }, 0)
    })
  }
}

/* 
 * Credit to https://medium.com/@95yashsharma/polyfill-for-promise-allsettled-965f9f2a003
 */
if (typeof Promise.allSettled !== 'function') {
  Promise.allSettled = function (promises) {
    let mappedPromises = promises.map((p) => {
      return p
        .then((value) => {
          return {
            status: 'fulfilled',
            value,
          };
        })
        .catch((reason) => {
          return {
            status: 'rejected',
            reason,
          };
        });
    });
    return Promise.all(mappedPromises);
  };
}