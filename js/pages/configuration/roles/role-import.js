define([
  'knockout',
  'text!./role-import.html',
  'components/Component',
  'utils/AutoBind',
  'utils/CommonUtils',
  'ajv',
  'services/User',
  'services/AuthAPI',
  'services/role',
  'databindings',
  'components/ac-access-denied',
  'components/heading',
  'components/empty-state',
  'less!./role-import.less'
], function (
  ko,
  view,
  Component,
  AutoBind,
  commonUtils,
  Ajv,
  UserService,
  AuthService,
  RoleService
) {
  const ajv = new Ajv({ allErrors: true });
  const PERMISSION_ID_REGEX = /:[0-9]+:/;

  class RolesImport extends AutoBind(Component) {

      constructor(params) {
        super(params);

        this.roles = ko.observable();
        this.existingRoles = [];
        this.existingPermissions = [];
        this.users = {};
        this.permissions = {};

        this.isProcessing = ko.observable(false);
        this.processed = ko.observable(0);

        this.json = ko.observable();
        this.isJSONValid = ko.observable(true);
        this.validationErrors = ko.observable();
        this.rolesJSONSchema = {
          "type": "array",
          "items": {
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
          },
        };

        this.isAuthenticated = AuthService.isAuthenticated;
        this.hasAccess = AuthService.isPermittedCreateRole;

        this.updateExisting();
        this.json.subscribe(this.parseJSON);
        this.warnings = ko.observable({});
      }

      async updateExisting() {
        const users = await UserService.getUsers();
        const usersMap = {};
        users.forEach(user => {
          usersMap[user.login] = user;
        });
        this.users = usersMap;

        const roles = await RoleService.getList();
        this.existingRoles = roles;

        const permissions = await RoleService.getPermissions();
        const permissionsMap = {};
        permissions.forEach(p => {
          permissionsMap[p.permission] = p;
        });
        this.permissions = permissionsMap;
        this.existingPermissions = permissions;
      }

      parseJSON(json) {
        let isValid = true;
        let error = '';
        let roles = [];
        this.isProcessing(false);
        try {
          roles = JSON.parse(json);
          isValid = ajv.validate(this.rolesJSONSchema, roles);
          if (!isValid) {
            throw new Error(ajv.errorsText(ajv.errors));
          }
          roles = roles.map(role => {
            if (this.existingRoles.find(erole => erole.role === role.role)) {
              throw new Error(`Role "${role.role}" already exists`);
            }

            const users = this.reduceArray(role.users, 'id', this.users);
            const permissions = this.reduceArray(role.permissions, 'id', this.permissions);
            return {
              ...role,
              users,
              permissions,
              roleUsers: role.users,
              rolePermissions: role.permissions,
              usersList: role.users.map(u => u.id).join(', '),
              permissionsList: role.permissions.map(p => p.id).join(', '),
            };
          })
        } catch(er) {
          roles = [];
          isValid = false;
          error = er;
        } finally {
          this.isJSONValid(isValid);
          this.validationErrors(error);
          this.roles(roles);
          this.setWarnings();
        }
      }

      setWarnings() {
        const jsonIssues = this.roles().some(role => role.permissions.unavailable.length || role.users.unavailable.length);
        const permissionSpecificIdsIssues = this.roles().some(role => role.rolePermissions.some(p => PERMISSION_ID_REGEX.test(p.id)));
        this.warnings({ jsonIssues, permissionSpecificIdsIssues });
      }

      reduceArray(inputArray = [], key = '', existingPermissionsMap = []) {
        const defaultObject = { available: [], unavailable: [] };
        return inputArray
        ? inputArray.reduce((prev, curr) => {
            const permission = existingPermissionsMap[curr[key]];
            const availabilityKey = permission ? 'available' : 'unavailable';
            return {
              ...prev,
              [availabilityKey]: [ ...prev[availabilityKey], (permission || curr) ],
            }
          }, defaultObject)
        : defaultObject;
      }

      fixJSON(type = 'jsonIssues') {
        const newJson = JSON.stringify(JSON.parse(this.json()).map(role => {
          const r = this.roles().find(r => r.role === role.role);
          const newRole = { role: r.role };
          if (type === 'jsonIssues') {
            Object.assign(newRole, {
              users: r.users.available.map(u => ({ id: u.login })),
              permissions: r.permissions.available.map(p => ({ id: p.permission })),
            })
          } else if (type === 'permissionSpecificIdsIssues') {
            Object.assign(newRole, {
              users: r.roleUsers,
              permissions: r.rolePermissions.filter(p => !PERMISSION_ID_REGEX.test(p.id)),
            })
          }
          return newRole;
         }));
         this.json(newJson);
      }


      async createRole(role) {
        const { id } = await RoleService.create(role);
        if (role.users && role.users.length) {
          await RoleService.addRelations(id, 'users', role.users.map(user => user.id));
        }
        if (role.permissions && role.permissions.length) {
          await RoleService.addRelations(id, 'permissions', role.permissions.map(p => p.id));
        }
      }

      async * createRoles() {
        const roles = this.roles().map(role => ({ ...role, permissions: role.permissions.available, users: role.users.available }));
        for(let i=0; i<roles.length; i++) {
          try  {
            yield await this.createRole(roles[i]);
          } catch(er) {
            alert(`Couldn't create role ${roles[i].role}`);
            break;
          }
        }
      }

      async doImport() {
        this.isProcessing(true);
        this.processed(0);

        for await (let role of this.createRoles()) {
          this.processed(this.processed() + 1);
        }

        this.updateExisting();
      }
  }

  return commonUtils.build('role-import', RolesImport, view);
});
