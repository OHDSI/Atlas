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