define(function (require, exports) {
    var $ = require('jquery');
    var constants = require('const');
    const httpService = require('services/http');
    
    async function getRoleUsers(subject, permissionManagementRoleId) {
	return await httpService.doGet(constants.apiPaths.roleUsers(permissionManagementRoleId))
	      .then(({ data = [] }) => data)
	      .catch((er) => {
		  console.error('ERROR: Can\'t find users with permissionManagementRoleId: ' + permissionManagementRoleId);
	      });
    };
    
    async function checkIfRoleCanShare(subject, permissionManagementRoleId) {
	var isAbleToShare = false;
	const roleUsers = await getRoleUsers(subject, permissionManagementRoleId);
	console.log("INFO: roleUsers:" + roleUsers.toString());
	
	roleUsers.forEach((user) => {
	    console.log("INFO: user.login of user that has the permissionManagementRoleId " + permissionManagementRoleId + ": " + user.login + "; subject (currently logged in user): " + subject);
            if (subject == user.login){
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
