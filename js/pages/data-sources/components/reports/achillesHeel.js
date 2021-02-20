define([
	'knockout',
	'text!./achillesHeel.html',
	'd3',
	'utils/CommonUtils',
	'pages/data-sources/classes/Report',
	'components/Component',
	'components/heading',
	'faceted-datatable'
], function (
	ko,
	view,
	d3,
	commonUtils,
	Report,
	Component,
) {
	class AchillesHeel extends Report {
		constructor(params) {
			super(params);
			this.columns = [
				{
					title: 'Message Type',
					data: 'type',
					visible: true,
					width: 200,
				},
				{
					title: 'Message',
					data: 'content',
					visible: true,
				},
			];
			this.data = ko.observableArray();
			this.template = '<<"row vertical-align"<"col-xs-6"<"dt-btn"B>l><"col-xs-6 search"f>><"row vertical-align"<"col-xs-3"i><"col-xs-9"p>><t><"row vertical-align"<"col-xs-3"i><"col-xs-9"p>>>';
		
			this.loadData();
		}

        loadData() {
            this.getData()
                .then(({ data }) => {
                    this.data(data.messages.map((message) => {
                        const temp = message.attributeValue;
                        const colon_index = temp.indexOf(':');
                        const message_type = temp.substring(0, colon_index);
                        let message_content = temp.substring(colon_index + 1);

                        // RSD - A quick hack to put commas into large numbers.
                        // Found the regexp at:
                        // https://stackoverflow.com/questions/23104663/knockoutjs-format-numbers-with-commas
                        message_content = message_content.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                        return {
                            'type': message_type,
                            'content': message_content
                        };
                    }));
                });
        }
	}

	return commonUtils.build('report-achilles-heel', AchillesHeel, view);
});
