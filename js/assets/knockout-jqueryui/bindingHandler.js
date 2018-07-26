/*global define*/
define(

    [
        'jquery',
        'knockout'
    ],

    function ($, ko) {

        'use strict';

        var domDataKey, filterAndUnwrapProperties, subscribeToRefreshOn, BindingHandler;

        domDataKey = '__kojqui_options';

        filterAndUnwrapProperties = function (source, properties) {
            /// <summary>Filters and unwraps the properties of an object.</summary>
            /// <param name='source' type='Object'></param>
            /// <param name='properties' type='Array' elementType='String'></param>
            /// <returns type='Object'>A new object with the specified properties copied
            /// and unwrapped from source.</returns>

            var result = {};

            ko.utils.arrayForEach(properties, function (property) {
                if (source[property] !== undefined) {
                    result[property] = ko.utils.unwrapObservable(source[property]);
                }
            });

            return result;
        };

        subscribeToRefreshOn = function (widgetName, element, bindingValue) {
            /// <summary>Creates a subscription to the refreshOn observable.</summary>
            /// <param name='widgetName' type='String'>The widget's name.</param>
            /// <param name='element' type='DOMNode'></param>
            /// <param name='bindingValue' type='Object'></param>

            if (ko.isObservable(bindingValue.refreshOn)) {
                ko.computed({
                    read: function () {
                        bindingValue.refreshOn();
                        $(element)[widgetName]('refresh');
                    },
                    disposeWhenNodeIsRemoved: element
                });
            }
        };

        BindingHandler = function (widgetName) {
            /// <summary>Constructor.</summary>
            /// <param name='widgetName' type='String'>The jQuery UI widget's
            /// name.</param>

            this.widgetName = widgetName;
            this.widgetEventPrefix = widgetName;
            this.options = [];
            this.events = [];
            this.hasRefresh = false;
        };

        /*jslint unparam:true*/
        BindingHandler.prototype.init = function (element, valueAccessor,
            allBindingsAccessor, viewModel, bindingContext) {

            var widgetName, value, unwrappedOptions, unwrappedEvents;

            widgetName = this.widgetName;
            value = valueAccessor();
            unwrappedOptions = filterAndUnwrapProperties(value, this.options);
            unwrappedEvents = filterAndUnwrapProperties(value, this.events);

            // allow inner elements' bindings to finish before initializing the widget
            ko.applyBindingsToDescendants(bindingContext, element);

            // store the options' values so they can be checked for changes in the
            // update() method
            ko.utils.domData.set(element, domDataKey, unwrappedOptions);

            // bind the widget events to the viewmodel
            $.each(unwrappedEvents, function (key, value) {
                unwrappedEvents[key] = value.bind(viewModel);
            });

            // initialize the widget
            $(element)[widgetName](ko.utils.extend(unwrappedOptions, unwrappedEvents));

            if (this.hasRefresh) {
                subscribeToRefreshOn(widgetName, element, value);
            }

            // store the element in the widget observable
            if (ko.isWriteableObservable(value.widget)) {
                value.widget($(element));
            }

            // handle disposal
            ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
                $(element)[widgetName]('destroy');
            });

            // the inner elements have already been taken care of
            return { controlsDescendantBindings: true };
        };
        /*jslint unparam:false*/

        BindingHandler.prototype.update = function (element, valueAccessor) {

            var widgetName, value, oldOptions, newOptions;

            widgetName = this.widgetName;
            value = valueAccessor();
            oldOptions = ko.utils.domData.get(element, domDataKey);
            newOptions = filterAndUnwrapProperties(value, this.options);

            // set only the changed options
            $.each(newOptions, function (prop, val) {
                if (val !== oldOptions[prop]) {
                    $(element)[widgetName]('option', prop, newOptions[prop]);
                }
            });

            // store the options' values so they can be checked for changes in the next
            // update() method
            ko.utils.domData.set(element, domDataKey, newOptions);
        };

        BindingHandler.prototype.on = function (element, type, callback) {
            /// <summary>Attaches callback to a widget event.</summary>
            /// <param name='element' type='DOMElement'></param>
            /// <param name='type' type='String'></param>
            /// <param name='callback' type='Function'></param>

            var eventName;

            // the same algorithm as in widget._trigger()
            if (type === this.widgetEventPrefix) {
                eventName = type;
            } else {
                eventName = this.widgetEventPrefix + type;
            }
            eventName = [eventName.toLowerCase(), '.', this.widgetName].join('');

            $(element).on(eventName, callback);

            // handle disposal
            ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
                $(element).off(eventName);
            });
        };

        return BindingHandler;
    }
);
