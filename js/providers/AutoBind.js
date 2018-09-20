define([], () => {
  
  // preserve context to use in knockout bindings
  const AutoBind = (C = class {}) => class AutoBind extends C {
    constructor(props) {
      super(props);
      const ownMethods = Object.getOwnPropertyNames(this.__proto__)
        .filter(method => !(['constructor', 'componentName'].includes(method)) && typeof this[method] === 'function');
      ownMethods.forEach(method => {
        this[method] = this[method].bind(this);
      });
    }
  };

  return AutoBind;
});