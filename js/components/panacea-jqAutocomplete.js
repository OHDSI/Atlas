//from https://github.com/rniemeyer/knockout-jqAutocomplete
define(['knockout', 'jquery'], function (ko, $) {
    var JqAuto = function() {
        var self = this,
            unwrap = ko.utils.unwrapObservable; //support older KO versions that did not have ko.unwrap

        //binding's init function
        this.init = function(element, valueAccessor, allBindings, data, context) {
            var existingSelect, existingChange,
                options = unwrap(valueAccessor()),
                config = {},
                filter = typeof options.filter === "function" ? options.filter : self.defaultFilter;

            //extend with global options
            ko.utils.extend(config, self.options);
            //override with options passed in binding
            ko.utils.extend(config, options.options);

            //get source from a function (can be remote call)
            if (typeof options.source === "function" && !ko.isObservable(options.source)) {
                config.source = function(request, response) {
                    //provide a wrapper to the normal response callback
                    var callback = function(data) {
                        self.processOptions(valueAccessor, null, data, request, response);
                    };

                    //call the provided function for retrieving data
                    options.source.call(context.$data, request.term, callback);
                };
            }
            else {
                //process local data
                config.source = self.processOptions.bind(self, valueAccessor, filter, options.source);
            }

            //save any passed in select/change calls
            existingSelect = typeof config.select === "function" && config.select;
            existingChange = typeof config.change === "function" && config.change;

            //handle updating the actual value
            config.select = function(event, ui) {
                if (ui.item && ui.item.actual) {
                    options.value(ui.item.actual);

                    if (ko.isWriteableObservable(options.dataValue)) {
                        options.dataValue(ui.item.data);
                    }
                }

                if (existingSelect) {
                    existingSelect.apply(this, arguments);
                }
            };

            //user made a change without selecting a value from the list
            config.change = function(event, ui) {
                if (!ui.item || !ui.item.actual) {
                    options.value(event.target && event.target.value);

                    if (ko.isWriteableObservable(options.dataValue)) {
                        options.dataValue(null);
                    }
                }

                if (existingChange) {
                    existingChange.apply(this, arguments);
                }
            };

            //initialize the widget
            var widget = $(element).autocomplete(config).data("ui-autocomplete");

            //render a template for the items
            if (options.template) {
                widget._renderItem = self.renderItem.bind(self, options.template, context);
            }

            //destroy the widget if KO removes the element
            ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
                if (widget && typeof widget.destroy === "function") {
                    widget.destroy();
                    widget = null;
                }
            });
        };

        //the binding's update function. keep value in sync with model
        this.update = function(element, valueAccessor) {
            var propNames, sources,
                options = unwrap(valueAccessor()),
                value = unwrap(options && options.value);

            if (!value && value !== 0) {
                value = "";
            }

            // find the appropriate value for the input
            sources = unwrap(options.source);
            propNames = self.getPropertyNames(valueAccessor);

            // if there is local data, then try to determine the appropriate value for the input
            if ($.isArray(sources) && propNames.value) {
                value = ko.utils.arrayFirst(sources, function (opt) {
                        return opt[propNames.value] == value;
                    }
                ) || value;
            }

            if (propNames.input && value && typeof value === "object") {
                element.value = value[propNames.input];
            }
            else {
                element.value = value;
            }
        };

        //if dealing with local data, the default filtering function
        this.defaultFilter = function(item, term) {
            term = term && term.toLowerCase();
            return (item || item === 0) && ko.toJSON(item).toLowerCase().indexOf(term) > -1;
        };

        //filter/map options to be in a format that autocomplete requires
        this.processOptions = function(valueAccessor, filter, data, request, response) {
            var item, index, length,
                items = unwrap(data) || [],
                results = [],
                props = this.getPropertyNames(valueAccessor);

            //filter/map items
            for (index = 0, length = items.length; index < length; index++) {
                item = items[index];

                if (!filter || filter(item, request.term)) {
                    results.push({
                        label: props.label ? item[props.label] : item.toString(),
                        value: props.input ? item[props.input] : item.toString(),
                        actual: props.value ? item[props.value] : item,
                        data: item
                    });
                }
            }

            //call autocomplete callback to display list
            response(results);
        };

        //if specified, use a template to render an item
        this.renderItem = function(templateName, context, ul, item) {
            var $li = $("<li></li>").appendTo(ul),
                itemContext = context.createChildContext(item.data);

            //apply the template binding
            ko.applyBindingsToNode($li[0], { template: templateName }, itemContext);

            //clean up
            $li.one("remove", ko.cleanNode.bind(ko, $li[0]));

            return $li;
        };

        //retrieve the property names to use for the label, input, and value
        this.getPropertyNames = function(valueAccessor) {
            var options = ko.toJS(valueAccessor());

            return {
                label: options.labelProp || options.valueProp,
                input: options.inputProp || options.labelProp || options.valueProp,
                value: options.valueProp
            };
        };

        //default global options passed into autocomplete widget
        this.options = {
            autoFocus: true,
            delay: 50
        };
    };

    ko.bindingHandlers.jqAuto = new JqAuto();
});
