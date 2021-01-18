define([
  'knockout',
  'text!./role-import.html',
  'components/Component',
  'utils/AutoBind',
  'utils/CommonUtils',
  'pages/configuration/roles/roleJsonParser',
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
  roleJsonParser,
  UserService,
  AuthService,
  RoleService
) {

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

        this.isAuthenticated = AuthService.isAuthenticated;
        this.hasAccess = AuthService.isPermittedCreateRole;
        this.tableOptions = commonUtils.getTableOptions('S');
        this.updateExisting();
        this.json.subscribe(this.parseJSON);
        this.warnings = ko.observable({});
      }

      parseJSON(json) {
        this.isProcessing(false);
        let parseJsonResult = roleJsonParser.validateAndParseRoles(json,  this.users, this.permissions, this.existingRoles);

        this.isJSONValid(parseJsonResult.isValid);
        this.validationErrors(parseJsonResult.error);
        this.roles(parseJsonResult.roles);
        this.setWarnings();

      }

      setWarnings() {
        const jsonIssues = this.roles().some(role => role.permissions.unavailable.length || role.users.unavailable.length);
        const permissionSpecificIdsIssues = this.roles().some(role => role.rolePermissions.some(p => roleJsonParser.isPermissionContainExplicitId(p.id)));
        this.warnings({ jsonIssues, permissionSpecificIdsIssues });
      }

      fixJSON(type = 'jsonIssues') {
        let json = this.json();
        let roles = this.roles();
        const newJson = roleJsonParser.fixRoles(json, roles, type);
        this.json(newJson);
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
