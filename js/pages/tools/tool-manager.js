define([
	'knockout',
	'text!./tool-manager.html',
	'pages/Page',
	'utils/CommonUtils',
	'services/AuthAPI',
	'services/ToolService',
	'services/MomentAPI',
	'./PermissionService',
	'css!styles/switch-button.css',
	'less!./tool-management.less',
], function (
	ko,
	view,
	Page,
	commonUtils,
	authApi,
	toolService,
	momentApi,
	PermissionService
) {
	class ToolManage extends Page {
		constructor(params) {
			super(params);
			this.data_tools = ko.observableArray();
			this.loading = ko.observable();
			this.showModalAddTool = ko.observable(false);
			this.newName = ko.observable(null);
			this.newUrl = ko.observable(null);
			this.newDescription = ko.observable(null);
			this.toolIsVisible = ko.observable(false);

			this.getValueUrl = this.getValueUrl.bind(this);
			this.handleDataAddTool = this.handleDataAddTool.bind(this);
			this.handleOpenLink = this.handleOpenLink.bind(this);
			this.handleCancelTool = this.handleCancelTool.bind(this);
			this.handleClearData = this.handleClearData.bind(this);
			this.isAuthenticated = authApi.isAuthenticated;

			this.canReadTools = PermissionService.isPermittedReadTools;
			this.canCreateTool = PermissionService.isPermittedCreateTool;
			this.canUpdateTool = PermissionService.isPermittedUpdateTool;
			this.canDeleteTool = PermissionService.isPermittedDeleteTool;

			this.showModalAddTool.subscribe((isShow) => {
				if(!isShow) this.handleClearData();
			})
		}


		handleIsEditing(id) {
			const newData = this.data_tools().map((item) => {
				if(id === item.id){
					return ({
						...item,
						isEditing: true
					})
				}
				return item
			})
			this.data_tools(newData);
		}

		handleClearData(){
			this.newName(null);
			this.newDescription(null);
			this.newUrl(null);
			this.toolIsVisible(false);
			this.showModalAddTool(false);
		}

		handleCancelTool(){
			this.handleClearData();
		}

		handleOpenLink(data, event){
			if(data.isEditing) return;
			if(["editIcon", "deleteIcon", "completeIcon"].includes(event.target.id)) return;
			return window.open(data.url, '_blank');
		}

		async handleIsEdited(id) {
			this.loading(true);
			try {
				const dataAdjust = this.data_tools().find(tool => tool.id === id);
				const data = {
					id,
					name: dataAdjust.name,
					url: dataAdjust.url,
					description: dataAdjust.description,
					enabled: dataAdjust.enabled
				}
				await toolService.updateTool(data);
			}catch(error){
				console.log('update tool failed', error)
			} finally {
				this.loading(false);
				this.getToolFromAllPages();
				return false;
			}
		}

		async handleDelete(id) {
			this.loading(true);
			try {
				await toolService.deleteTool(id);
			}catch(error){
				console.log('delete tool failed', error)
			} finally {
				this.loading(false);
				this.getToolFromAllPages();
			}
		}

		async toggleVisiableTool(){
			this.toolIsVisible(!this.toolIsVisible())
		}

		async handleCheckVisible(id){
			const newData = this.data_tools().map((item) => {
				if(id === item.id){
					return ({
						...item,
						enabled: !item.enabled
					})
				}
				return item
			})
			await this.data_tools(newData);
		}

		getValueUrl(data, event){
			const newData = this.data_tools().map((item) => {
				if(data.id === item.id){
					return ({
						...item,
						url: data.url,
						description: data.description
					})
				}
				return item
			})
			this.data_tools(newData);
		}

		async handleDataAddTool(data){
			this.loading(true);
			try {
				const dataPayload = {
					name: data.newName(),
					description: data.newDescription(),
					url: data.newUrl(),
					enabled: data.toolIsVisible()
				};
				await toolService.createTool(dataPayload);
			}catch(error){
				console.log('add new tool failed', error)
			} finally {
				this.handleClearData();
				this.getToolFromAllPages();
				this.loading(false);
			}
		}

		async onPageCreated() {
			if(this.canReadTools()){
				this.getToolFromAllPages();
			}
		}

		async getToolFromAllPages() {
			this.loading(true);
			try {
				this.data_tools([]);
				const dataTools = await toolService.getTools();
				Array.isArray(dataTools) && dataTools.forEach((item, index) => {
					this.data_tools.push({
					...item,
					createdDate: momentApi.formatDate(item.createdDate, 'DD/MM/YYYY HH:mm:ss'),
					isEditing: false,
					updatedDate: momentApi.formatDate(item.modifiedDate, 'DD/MM/YYYY HH:mm:ss'),
					createdBy: item.createdByName ?? ''
				})});
			} finally {
				this.loading(false);
			}
		}
	}

	return commonUtils.build('tool-manager', ToolManage, view);
});
