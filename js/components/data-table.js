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
		constructor() {
			super();
			this.name = 'data-table';
			this.view = view;
			this.element = null;
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

			this.data.subscribe(this.draw.bind(this));
			this.setReference = this.setReference.bind(this);
		}

		setReference(element) {
			this.element = element;
		}

		draw() {
			if (!this.data()) {
				return false;
			}
			$(this.element).DataTable({
				...this.options,
				data: this.data(),
			});
		}

		render(params) {
			super.render(params);
			if (params.template) {
				this.options.template = params.template;
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
			this.columns = params.columns;
			this.data(params.data());

			this.draw();

			return this;
		}
  }

	const component = new DataTable();
	return component.build();
});
