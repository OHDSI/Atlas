define([
		'knockout',
		'text!./role-import.html',
		'components/Component',
		'utils/AutoBind',
		'utils/CommonUtils',
		'ajv'],
	(
		ko,
		view,
		Component,
		AutoBind,
		commonUtils,
		Ajv
	) => {
		const ajv = new Ajv({ allErrors: true });
		const ROLE_PERMISSION = "role";
		const PUBLIC_ROLE_ID = 1;
		const PERMISSION_ID_REGEX = /:[0-9]+:/;
		const roleJSONSchema = {
			"type": "object",
			"required": ["role"],
			"properties": {
				"role": {
					"type": "string",
				},
				"users": {
					"type": "array",
					"items": {
						"type": "object",
						"required": ["id"],
						"properties": {
							"id": {
								"type": "string",
							},
						},
					},
				},
				"permissions": {
					"type": "array",
					"items": {
						"type": "object",
						"required": ["id"],
						"properties": {
							"id": {
								"type": "string",
							},
						},
					},
				},
			},
		};
		const rolesJSONSchema = {
			"type": "array",
			"items": roleJSONSchema,
		};


		const validateAndParseRoles = function (json, userItems, permissionItems, existingRoles) {
			let isValid = true;
			let error = '';
			let roles = [];
			try {
				var object = JSON.parse(json);
				if (Array.isArray(object)) {
					isValid = ajv.validate(rolesJSONSchema, object);
					if (isValid) {
						roles = object.map(role => {
							return this.parseRole(existingRoles, role, userItems, permissionItems);
						});
					}
				} else {
					isValid = ajv.validate(roleJSONSchema, object);
					if (isValid) {
						roles = [this.parseRole(existingRoles, object, userItems, permissionItems)];
					}
				}

				if (!isValid) {
					throw new Error(ajv.errorsText(ajv.errors));
				}
			} catch (er) {
				roles = [];
				isValid = false;
				error = er;
			}
			return {
				roles,
				isValid,
				error
			};
		}

		const parseRole = function (existingRoles, role, userItems, permissionItems) {
			if (existingRoles.find(erole => erole.role === role.role)) {
				throw new Error(`Role "${role.role}" already exists`);
			}

			const users = this.reduceArray(role.users, 'id', userItems);
			const permissions = this.reduceArray(role.permissions, 'id', permissionItems);
			return {
				...role,
				users,
				permissions,
				roleUsers: role.users,
				rolePermissions: role.permissions,
				usersList: role.users.map(u => u.id).join(', '),
				permissionsList: role.permissions.map(p => p.id).join(', '),
			};
		}

		const fixRoles = function (json, roles, type) {
			let object = JSON.parse(json);
			if (Array.isArray(object)) {
				return JSON.stringify(object.map(role => {
					return this.fixRole(roles, role, type);
				}), null, 2);
			} else {
				return JSON.stringify(this.fixRole(roles, object, type),null, 2);
			}

		}

		const fixRole = function fixRole(roles, role, type) {
			const r = roles.find(r => r.role === role.role);
			const newRole = { role: r.role };
			if (type === 'jsonIssues') {
				Object.assign(newRole, {
					users: r.users.available.map(u => ({ id: u.login })),
					permissions: r.permissions.available.map(p => ({ id: p.permission })),
				});
			} else if (type === 'permissionSpecificIdsIssues') {
				Object.assign(newRole, {
					users: r.roleUsers,
					permissions: r.rolePermissions.filter(p => !this.isPermissionContainExplicitId(p.id)),
				});
			}
			return newRole;
		}

		const reduceArray = function (inputArray = [], key = '', existingPermissionsMap = []) {
			const defaultObject = { available: [], unavailable: [] };
			return inputArray
				? inputArray
					.reduce((prev, curr) => {
						const permission = existingPermissionsMap[curr[key]];
						const availabilityKey = permission ? 'available' : 'unavailable';
						return {
							...prev,
							[availabilityKey]: [...prev[availabilityKey], (permission || curr)],
						}
					}, defaultObject)
				: defaultObject;
		}

		const isPermissionContainExplicitId = function (permision){
			return PERMISSION_ID_REGEX.test(permision)
				&& !permision.startsWith(ROLE_PERMISSION + ":" + PUBLIC_ROLE_ID + ":") //public role is predefine and has id=1
		}

		return {
			validateAndParseRoles,
			parseRole,
			fixRoles,
			fixRole,
			reduceArray,
			isPermissionContainExplicitId
		};
	});