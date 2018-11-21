/*global define*/
/*jslint browser:true*/
define(

    [
			'jquery',
			'knockout',
			'./bindingHandler',
			'./utils',
			'jquery-ui/ui/widgets/dialog'
    ],

    function ($, ko, BindingHandler, utils) {

        'use strict';

        var Dialog = function () {
            /// <summary>Constructor.</summary>

            BindingHandler.call(this, 'dialog');

            if (utils.uiVersion.major === 1 && utils.uiVersion.minor === 8) {
                this.options = ['autoOpen', 'buttons', 'closeOnEscape', 'closeText',
                    'dialogClass', 'disabled', 'draggable', 'height', 'maxHeight',
                    'maxWidth', 'minHeight', 'minWidth', 'modal', 'position', 'resizable',
                    'show', 'stack', 'title', 'width', 'zIndex'];
                this.events = ['beforeClose', 'create', 'open', 'focus', 'dragStart',
                    'drag', 'dragStop', 'resizeStart', 'resize', 'resizeStop', 'close'];
            } else if (utils.uiVersion.major === 1 && utils.uiVersion.minor === 9) {
                this.options = ['autoOpen', 'buttons', 'closeOnEscape', 'closeText',
                    'dialogClass', 'draggable', 'height', 'hide', 'maxHeight', 'maxWidth',
                    'minHeight', 'minWidth', 'modal', 'position', 'resizable', 'show',
                    'stack', 'title', 'width', 'zIndex'];
                this.events = ['beforeClose', 'create', 'open', 'focus', 'dragStart',
                    'drag', 'dragStop', 'resizeStart', 'resize', 'resizeStop', 'close'];
            } else {
                this.options = ['appendTo', 'autoOpen', 'buttons', 'closeOnEscape',
                    'closeText', 'dialogClass', 'draggable', 'height', 'hide',
                    'maxHeight', 'maxWidth', 'minHeight', 'minWidth', 'modal', 'position',
                    'resizable', 'show', 'title', 'width'];
                this.events = ['beforeClose', 'create', 'open', 'focus', 'dragStart',
                    'drag', 'dragStop', 'resizeStart', 'resize', 'resizeStop', 'close'];
            }
        };

        Dialog.prototype = utils.createObject(BindingHandler.prototype);
        Dialog.prototype.constructor = Dialog;

        Dialog.prototype.init = function (element, valueAccessor) {
            /// <summary>Creates a hidden div before the element. This helps in disposing
            /// the binding if the element is moved from its original location.
            /// Keeps the isOpen binding property in sync with the dialog's state.
            // </summary>
            /// <param name='element' type='DOMNode'></param>
            /// <param name='valueAccessor' type='Function'></param>
            /// <returns type='Object'></returns>

            var marker, value;

            /// sets up the correct disposal
            marker = document.createElement('DIV');
            marker.style.display = 'none';
            element.parentNode.insertBefore(marker, element);

            ko.utils.domNodeDisposal.addDisposeCallback(marker, function () {
                ko.removeNode(element);
            });

            /// invokes the prototype's init() method
            BindingHandler.prototype.init.apply(this, arguments);

            /// sets up handling of the isOpen option
            value = valueAccessor();

            if (value.isOpen) {
                ko.computed({
                    read: function () {
                        if (ko.utils.unwrapObservable(value.isOpen)) {
                            $(element)[this.widgetName]('open');
                        } else {
                            $(element)[this.widgetName]('close');
                        }
                    },
                    disposeWhenNodeIsRemoved: element,
                    owner: this
                });
            }
            if (ko.isWriteableObservable(value.isOpen)) {
                this.on(element, 'open', function () {
                    value.isOpen(true);
                });
                this.on(element, 'close', function () {
                    value.isOpen(false);
                });
            }

            // make the width option two-way
            if (ko.isWriteableObservable(value.width)) {
                /*jslint unparam:true*/
                this.on(element, 'resizestop', function (ev, ui) {
                    value.width(Math.round(ui.size.width));
                });
                /*jslint unparam:false*/
            }

            // make the height option two-way
            if (ko.isWriteableObservable(value.height)) {
                /*jslint unparam:true*/
                this.on(element, 'resizestop', function (ev, ui) {
                    value.height(Math.round(ui.size.height));
                });
                /*jslint unparam:false*/
            }

            // the inner elements have already been taken care of
            return { controlsDescendantBindings: true };
        };

        utils.register(Dialog);

        return Dialog;
    }
);
