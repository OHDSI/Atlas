define(function (require, exports) {
    var $ = require('jquery');
    var constants = require('const');
    const httpService = require('services/http');
	const authApi = require('services/AuthAPI');
    
	async function getUserRoles() {
		return await httpService.doGet(constants.apiPaths.userRoles(authApi.userId()))
			  .then(({ data = [] }) => data)
			  .catch((er) => {
			  console.error('ERROR: Can\'t find user roles for: ' + authApi.userId());
			  });
		};
    async function checkIfRoleCanShare(subject, permissionManagementRoleId) {
	var isAbleToShare = false;
	const userRoles = await getUserRoles();
	console.log("INFO: roleUsers:" + userRoles.toString());
	
	userRoles.forEach((role) => {
	    console.log("INFO: role " + role );
            if (role.id == permissionManagementRoleId){
				isAbleToShare = true;
	    }
    });
	console.log("INFO: isAbleToShare: " + isAbleToShare);
	return isAbleToShare;
    };

    return {
	checkIfRoleCanShare,
    };
});
