		(function () {
			define(["jquery", "datatables.net", "colvis"], function ($) {
				var achilles_heel = {};

				achilles_heel.render = function (datasource) {
					$('#reportAchillesHeel svg').remove();
				
					$.ajax({
						type: "GET",
						url: getUrlFromData(datasource, "achillesheel"),
						contentType: "application/json; charset=utf-8",
						success: function (data) {
							table_data = [];

							for (i = 0; i < data.MESSAGES.ATTRIBUTEVALUE.length; i++) {
								temp = data.MESSAGES.ATTRIBUTEVALUE[i];
								message_type = temp.substring(0, temp.indexOf(':'));
								message_content = temp.substring(temp.indexOf(':') + 1);

								// RSD - A quick hack to put commas into large numbers.
								// Found the regexp at:
								// https://stackoverflow.com/questions/23104663/knockoutjs-format-numbers-with-commas
								message_content = message_content.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

								table_data[i] = {
									'type': message_type,
									'content': message_content
								};
							}

							datatable = $('#achillesheel_table').DataTable({
								dom: 'lfrt<"row"<"col-sm-4" i ><"col-sm-4" T ><"col-sm-4" p >>',
								tableTools: {
            			"sSwfPath": "js/components/datasources/swf/copy_csv_xls_pdf.swf"
        				},
								data: table_data,
								columns: [
									{
										data: 'type',
										visible: true,
										width:200
									},
									{
										data: 'content',
										visible: true
									}
								],
								pageLength: 15,
								lengthChange: false,
								deferRender: true,
								destroy: true
							});

							$('#reportAchillesHeel').show();
						}
					});
				}

				return achilles_heel;
			});
		})();
