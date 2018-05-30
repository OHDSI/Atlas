define([
	'knockout',
	'text!./data-table.html',
	'providers/Component',
], function (
	ko,
	view,
	Component
) {
	class DataTable extends Component {
		static get name() {
			return 'data-table';
		}

		static get view() {
			return view;
		}

		constructor(params) {
			super(params);
			this.container = ko.observable();
			this.template = '';
			this.columns = []; // { title, data, visible?, width? }
			this.data = ko.observableArray();
			
			this.options = {
				dom: this.template,
				buttons: ['colvis', 'copyHtml5', 'excelHtml5', 'csvHtml5', 'pdfHtml5'],
				autoWidth: false,
				columns: this.columns,
				pageLength: 15,
				lengthChange: false,
				deferRender: true,
				destroy: true,
			};			
			
			if (params.template) {
				this.options.dom = params.template;
			}
			if (params.buttons) {
				this.options.buttons = params.buttons;
			}
			if (params.autoWidth) {
				this.options.autoWidth = params.autoWidth;
			}
			if (params.pageLength) {
				this.options.pageLength = params.pageLength;
			}
			if (params.lengthChange) {
				this.options.lengthChange = params.lengthChange;
			}
			if (params.deferRender) {
				this.options.deferRender = params.deferRender;
			}
			if (params.destroy) {
				this.options.destroy = params.destroy;
			}
			this.options.columns = params.columns;
			this.data.subscribe(() => this.draw());
			this.container.subscribe(() => this.draw());
			this.data(params.data());
		}

		draw() {
			if (!this.container() || !this.data()) {
				return false;
			}
			$(this.container()).DataTable({
				...this.options,
				data: this.data(),
			});
		}

  }

	return Component.build(DataTable);
});
