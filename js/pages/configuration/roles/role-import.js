define([
  'knockout',
  'text!./role-import.html',
  'components/Component',
  'utils/AutoBind',
  'utils/CommonUtils',
  'ajv',
  'services/User',
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
) {
  const ajv = new Ajv({ allErrors: true });

  class RolesImport extends AutoBind(Component) {
      roles = ko.observable();
      users = [];
      
      json = ko.observable();
      isJSONValid = ko.observable(true);
      validationErrors = ko.observable();
      rolesJSONSchema = {
        "type": "array",
        "items": {
          "type": "object",
          "required": ["name"],
          "properties": {
            "name": {
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
      }

      parseJSON(json) {
        let isValid = true;
        let error = '';
        let roles = [];
        try {
          roles = JSON.parse(json);
          isValid = ajv.validate(this.rolesJSONSchema, roles);
          if (!isValid) {
            throw new Error(ajv.errorsText(ajv.errors));
          }
          roles = roles.map(role => {
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

      doImport() {

      }      
  }

  return commonUtils.build('role-import', RolesImport, view);
});
