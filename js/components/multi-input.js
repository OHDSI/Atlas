define([
  'knockout',
  'text!./multi-input.html',
	'utils/CommonUtils',
  'components/Component',
  'utils/AutoBind',
  'lodash',  
  'databindings',
  'less!./multi-input.less',
], function (
  ko, 
    view,
    commonUtils,
    Component,
    AutoBind,
    _,
) {
    const typeIdentifier = {
      integer: "integer",
      float: "float"
    }
    class MultiInput extends AutoBind(Component) {
      constructor(params) {
        super(params);
        this.selectedValueType = params.selectedValueType || "integer";
        this.selectedValues = params.selectedValues;
        this.itemToAdd = ko.observable("").extend(this.getExtender());
        this.defaultValues = params.defaultValues;
        this.valueLabel = params.valueLabel || "Value";

        this.hasSelectedValues = ko.pureComputed(() => {
          return (this.selectedValues && this.selectedValues().length > 0);
        });
        this.hasDefaults = ko.pureComputed(() => {
          return (this.defaultValues && this.defaultValues.length > 0);
        });
        this.enableAdd = ko.pureComputed(() => {
         return (this.itemToAdd() !== null && this.itemToAdd().toString().length > 0 && !isNaN(this.getParser()(this.itemToAdd())));
        });
        this.enableDefaults = ko.pureComputed(() => {
          return (this.selectedValues && this.hasDefaults() && !(_.isEqual(_.sortBy(this.selectedValues()), _.sortBy(this.defaultValues))));
        });
        this.defaultText = ko.pureComputed(() => {
          return this.enableDefaults() ? 'Reset to default' : 'Using default';
        })
      }

      getParser() {
        let returnVal = (item) => { return item };
        switch(this.selectedValueType) {
          case typeIdentifier.integer:
            returnVal = parseInt;
            break;
          case typeIdentifier.float:
            returnVal = parseFloat;
            break;
        }
        return returnVal;
      }

      getExtender() {
        let returnVal = {};
        switch(this.selectedValueType) {
          case typeIdentifier.integer:
            returnVal = {numeric: 0};
            break;
          case typeIdentifier.float:
            returnVal = {numeric: 9};
            break;
        }
        return returnVal;
      }

      addItem() {
        if (this.itemToAdd() != null) {
          this.selectedValues.push(this.getParser()(this.itemToAdd()));
          this.itemToAdd(null);
        }
      }

      deleteItem(data,event) {
        const index = this.selectedValues.indexOf(data);
        this.selectedValues.splice(index, 1);
      }

      setToDefaults() {
        let defaultValues = this.defaultValues.slice();
        this.selectedValues(defaultValues);
      }

      enterPressed(data, context, event) {
        const keyCode = (event.which ? event.which : event.keyCode);
        if (keyCode === 13) {
          this.addItem();
        }
      }
    }

    return commonUtils.build('multi-input', MultiInput, view);
});