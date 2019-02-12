define(
  [],
  function () {

    class BemHelper {
      constructor(componentClass) {
        this.componentClass = componentClass;
        this.classSet = [];
      }

      parseModifiers(val) {
        let list = [];

        if (typeof val === 'string') {
          list.push(val);
        }

        if (typeof val === 'object' && Array.isArray(val)) {
            list = list.concat(val);
        }

        return list;
      }

      parseExtra(val) {
        let list = [];

        if (typeof val === 'string') {
          list.push(val);
        } else if (Array.isArray(val)) {
          list = val;
        }

        return list;
      }

      buildClassSet(model) {
        this.classSet = [];
        let entityClass;

        if (model.element) {
          entityClass = `${this.componentClass}__${model.element}`;
        } else {
          // if no element name specified - this is Block
          entityClass = this.componentClass;
        }
        this.classSet.push(entityClass);

        model.modifiers.forEach(mod => {
          this.classSet.push(`${entityClass}--${mod}`);
        });

        this.classSet = this.classSet.concat(model.extra);
      }

      run() {
        let model = { element: null, modifiers: [] };

        if (typeof arguments[0] === 'object') {
          model = {
            element: arguments[0].element,
            modifiers: this.parseModifiers(arguments[0].modifiers),
            extra: this.parseExtra(arguments[0].extra),
          };
        } else if (typeof arguments[0] === 'string') {
          model.element = arguments[0];
          if (typeof arguments[1] !== 'undefined') {
            model.modifiers = this.parseModifiers(arguments[1]);
          }
          if (typeof arguments[2] !== 'undefined') {
            model.extra = this.parseExtra(arguments[2]);
          }
        }

        this.buildClassSet(model);
        return this.classSet.join(' ');
      }
    }

    return BemHelper;
  }
);