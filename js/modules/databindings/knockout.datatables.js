/**
 * @summary     Datatables Custom Binding for Knockout.js
 * @description Allows Datatables to work with Knockout.js
 * @version     0
 * @file        knockout-datatables.js
 * @author      Chad Mullins
 * @originalSrc    https://github.com/CogShift/Knockout.Extensions
 *
 * This source file is free software, under either the GPL v2 license or a
 * BSD style license, available at:
 *   http://datatables.net/license_gpl2
 *   http://datatables.net/license_bsd
 *
 * This source file is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the license files for details.
 *
 * For details please refer to: http://www.datatables.net
 */
/*jslint sloppy: true, white: true, vars: true, nomen: true, eqeq: true, browser: true, plusplus: true */
/*globals $, jQuery, isInitialisedKey, ko*/
define(['jquery', 'knockout', 'datatables.net'], function ($, ko) {
	ko.bindingHandlers.templateDataTable = {
		'init': function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {

			"use strict";

			var binding, isInitialisedKey, options, theIndex, dataSource, dataTable, unwrappedItems, destRow, columnName, accesor;

			if ($.data(element, isInitialisedKey) === true) {
				return;
			}

			binding = ko.utils.unwrapObservable(valueAccessor());
			isInitialisedKey = "ko.bindingHandlers.dataTable.isInitialised";
			options = {};

			// ** Initialise the DataTables options object with the data-bind settings **

			// Clone the options object found in the data bindings.  This object will form the base for the DataTable initialisation object.
			if (binding.options) {
				options = $.extend(options, binding.options);
			}

			// Register the row template to be used with the DataTable.
			if (binding.rowTemplate && binding.rowTemplate !== '') {
				options.rowCallback = function (row, data) {
					// Render the row template for this row.
					ko.renderTemplate(binding.rowTemplate, data, null, row, "replaceChildren");
					return row;
				};
			}

			// Set the data source of the DataTable.
			if (binding.dataSource) {

				dataSource = ko.utils.unwrapObservable(binding.dataSource);

				if (dataSource instanceof Array) {
					// Set the initial datasource of the table.
					options.data = ko.utils.unwrapObservable(binding.dataSource);

					// If the data source is a knockout observable array...
					if (ko.isObservable(binding.dataSource)) {
						// Subscribe to the dataSource observable.  This callback will fire whenever items are added to 
						// and removed from the data source.
						binding.dataSource.subscribe(function (newItems) {
							// ** Redraw table **
							dataTable = $(element).dataTable();
							// Get a list of rows in the DataTable.
							var tableNodes = dataTable.fnGetNodes();

							// If the table contains rows...
							if (tableNodes.length) {
								// Unregister each of the table rows from knockout.
								ko.utils.arrayForEach(tableNodes, function (node) {
									ko.cleanNode(node);
								});
								// Clear the datatable of rows.
								dataTable.fnClearTable();
							}
							if (newItems && newItems.length > 0)
								dataTable.fnAddData(newItems);
						});
					}
				} else { // If the dataSource was not a function that retrieves data, or a javascript object array containing data.
					throw 'The dataSource defined must a javascript object array';
				}
			}

			// If no fnRowCallback has been registered in the DataTable's options, then register the default fnRowCallback.
			// This default fnRowCallback function is called for every row in the data source.  The intention of this callback
			// is to build a table row that is bound it's associated record in the data source via knockout js.
			if (!options.rowCallback) {
				options.rowCallback = function (row, srcData) {
					var columns = this.fnSettings().columns;

					// Empty the row that has been build by the DataTable of any child elements.
					destRow = $(row);
					destRow.empty();

					// For each column in the data table...
					ko.utils.arrayForEach(columns, function (column) {

						var newCell, accesor;

						columnName = column.data;

						newCell = $("<td></td>");

						// bind the cell to the observable in the current data row.
						accesor = eval("srcData['" + columnName.replace(".", "']['") + "']");

						destRow.append(newCell);
						if (columnName === 'action') {
							ko.applyBindingsToNode(newCell[0], {
								html: accesor
							}, srcData);
						} else {
							ko.applyBindingsToNode(newCell[0], {
								text: accesor
							}, srcData);
						}
					});
					return destRow[0];
				};
			}

			// If no fnDrawCallback has been registered in the DataTable's options, then register the default here. 
			// This default callback is called every time the table is drawn (for example, when the pagination is clicked). 

			if (!options.fnDrawCallback) {

				options.fnDrawCallback = function () {

					/*
          // There are some assumptions here that need to be better abstracted
          $(binding.expandIcon).click(function(){
              var theRow = $(this).parent().parent()[0]; //defined by the relationship between the clickable expand icon and the row. assumes that the icon (the trigger) is in a td which is in a tr. 
              rowContent = $(theRow).find(".hiddenRow").html();
              
              tableId = local[binding.gridId];
              
              if(tableId.fnIsOpen(theRow)){
                  $(this).removeClass('icon-contract '+binding.expandIcon);
                  $(this).addClass('icon-expand '+binding.expandIcon);
                  tableId.fnClose(theRow);
              }else{
                  $(this).removeClass('icon-expand '+binding.expandIcon);
                  $(this).addClass('icon-contract ' +binding.expandIcon);
                  tableId.fnOpen(theRow, rowContent, 'info_row');
              }
          });
          */

					if (binding.tooltip) {
						if (binding.tooltip[0]) {
							// bootstrap tooltip definition
							$("[rel=" + binding.tooltip[1] + "]").tooltip({
								placement: 'top',
								trigger: 'hover',
								animation: true,
								delay: {
									show: 1000,
									hide: 10
								}
							});
						}
					}
				};

			}

			binding.gridId = $(element).dataTable(options);

			$.data(element, isInitialisedKey, true);

			// Tell knockout that the control rendered by this binding is capable of managing the binding of it's descendent elements.
			// This is crutial, otherwise knockout will attempt to rebind elements that have been printed by the row template.
			return {
				controlsDescendantBindings: true
			};

		}
	};
});
