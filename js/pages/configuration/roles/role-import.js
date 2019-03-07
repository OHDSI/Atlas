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
      roles = ko.observable();
      existingRoles = [];
      users = [];

      isProcessing = ko.observable(false);
      processed = ko.observable(0);
      
      json = ko.observable();
      isJSONValid = ko.observable(true);
      validationErrors = ko.observable();
      rolesJSONSchema = {
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
          },
        },
      };

      isAuthenticated = AuthService.isAuthenticated;
      hasAccess = AuthService.isPermittedCreateRole;

      constructor(params) {
        super(params);
        this.json.subscribe(this.parseJSON);
        UserService.getUsers().then(users => {
          const usersMap = {};
          users.forEach(user => {
            usersMap[user.id] = user;
          });

          this.users = usersMap;
        });

        this.updateExistingRoles();
      }
      
      updateExistingRoles() {
        RoleService.getList().then(roles => {
          this.existingRoles = roles;
        });
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
            return {
              ...role,
              users,
              usersList: users.map(user => user.login).join(', ')
            };
          })
        } catch(er) {
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

        this.updateExistingRoles();
      }      
  }

  return commonUtils.build('role-import', RolesImport, view);
});
