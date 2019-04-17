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

  class RolesImport extends AutoBind(Component) {

      constructor(params) {
        super(params);

        this.roles = ko.observable();
        this.existingRoles = [];
        this.existingPermissions = [];
        this.users = [];

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
                      "type": "number",
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
                      "type": "number",
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
      }
      
      async updateExisting() {
        const users = await UserService.getUsers();
        const usersMap = {};
        users.forEach(user => {
          usersMap[user.id] = user;
        });  
        this.users = usersMap;

        const roles = await RoleService.getList();
        this.existingRoles = roles;

        const permissions = await RoleService.getPermissions();
        const permissionsMap = {};
        permissions.forEach(p => {
          permissionsMap[p.id] = p;
        });
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
            const users = role.users
              ? role.users.map(user => this.users[user.id]).filter(user => user)
              : [];
            const permissions = role.permissions
              ? role.permissions.map(p => this.existingPermissions[p.id]).filter(p => p)
              : [];
            return {
              ...role,
              users,
              permissions,
              usersList: users.map(user => user.login).join(', '),
              permissionsList: permissions.map(p => p.permission).join(', '),
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
        }

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
        const roles = this.roles();
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
