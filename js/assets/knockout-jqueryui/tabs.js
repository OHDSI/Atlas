/*global define*/
define(

    [
			'jquery',
			'knockout',
			'./bindingHandler',
			'./utils',
			'jquery-ui/ui/widgets/tabs'
    ],

    function ($, ko, BindingHandler, utils) {

        'use strict';

        var postInitHandler18, postInitHandler, Tabs;

        postInitHandler18 = function (element, valueAccessor) {
            /// <summary>Keeps the active binding property in sync with the tabs' state.
            /// </summary>
            /// <param name='element' type='DOMNode'></param>
            /// <param name='valueAccessor' type='Function'></param>

            var value = valueAccessor();

            if (ko.isWriteableObservable(value.selected)) {
                /*jslint unparam:true*/
                this.on(element, 'show', function (ev, ui) {
                    if ($(element)[0] === ev.target) {
                        // Only activate if this is the right tab widget.
                        value.selected(ui.index);
                    }
                });
                /*jslint unparam:false*/
            }
        };

        postInitHandler = function (element, valueAccessor) {
            /// <summary>Keeps the active binding property in sync with the tabs' state.
            /// </summary>
            /// <param name='element' type='DOMNode'></param>
            /// <param name='valueAccessor' type='Function'></param>

            var value = valueAccessor();

            if (ko.isWriteableObservable(value.active)) {
                /*jslint unparam:true*/
                this.on(element, 'activate', function (ev, ui) {
                    if ($(element)[0] === ev.target) {
                        // Only activate if this is the right tab widget.
                        value.active(ui.newTab.index());
                    }
                });
                /*jslint unparam:false*/
            }
        };

        Tabs = function () {
            /// <summary>Constructor.</summary>

            BindingHandler.call(this, 'tabs');

            this.version = utils.uiVersion;

            if (this.version.major === 1 && this.version.minor === 8) {
                this.options = ['ajaxOptions', 'cache', 'collapsible', 'cookie',
                    'disabled', 'event', 'fx', 'idPrefix', 'panelTemplate', 'selected',
                    'spinner', 'tabTemplate'];
                this.events = ['add', 'create', 'disable', 'enable', 'load', 'remove',
                    'select', 'show'];
                this.hasRefresh = false;
            } else {
                this.options = ['active', 'collapsible', 'disabled', 'event',
                    'heightStyle', 'hide', 'show'];
                this.events = ['activate', 'beforeActivate', 'beforeLoad', 'create',
                    'load'];
                this.hasRefresh = true;
            }
        };

        Tabs.prototype = utils.createObject(BindingHandler.prototype);
        Tabs.prototype.constructor = Tabs;

        Tabs.prototype.init = function (element, valueAccessor) {
            /// <summary>Keeps the active binding property in sync with the tabs' state.
            /// </summary>
            /// <param name='element' type='DOMNode'></param>
            /// <param name='valueAccessor' type='Function'></param>

            BindingHandler.prototype.init.apply(this, arguments);

            if (this.version.major === 1 && this.version.minor === 8) {
                postInitHandler18.call(this, element, valueAccessor);
            } else {
                postInitHandler.call(this, element, valueAccessor);
            }

            // the inner elements have already been taken care of
            return { controlsDescendantBindings: true };
        };

        utils.register(Tabs);

        return Tabs;
    }
);
