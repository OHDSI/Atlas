define(['knockout',
		'text!./step-header.html',
		'providers/Component',
		'utils/CommonUtils',],
	function(
		ko,
		view,
		Component,
		commonUtils
	) {

		class StepHeader extends Component{

			constructor(params){
				super(params);
				this.header = params.header || '';
			}
		}

		commonUtils.build('step-header', StepHeader, view);
	}
)