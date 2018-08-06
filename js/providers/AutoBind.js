define([], () => {
  const AutoBind = (C = class {}) => class AutoBind extends C {
    constructor(props) {
      super(props);
      const ownMethods = Object.getOwnPropertyNames(this.__proto__).filter(method => method !== 'constructor');
      ownMethods.forEach(method => {
        this[method] = this[method].bind(this);
      });
    }
  };

  return AutoBind;
});