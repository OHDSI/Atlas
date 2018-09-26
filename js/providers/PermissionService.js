define([
	'appConfig',
	'services/AuthService',
], function (
	config,
	AuthService,
) {
	class PermissionService {
		isPermitted(permission) {
			if (!config.userAuthenticationEnabled) {
					return true;
			}

			var etalons = AuthService.permissions();
			if (!etalons) {
					return false;
			}

			for (var i = 0; i < etalons.length; i++) {
					if (this.checkPermission(permission, etalons[i])) {
							return true;
					}
			}

			return false;
		}

		checkPermission(permission, etalon) {
			// etalon may be like '*:read,write:etc'
			if (!etalon || !permission) {
					return false;
			}

			if (permission == etalon) {
					return true;
			}

			var etalonLevels = etalon.split(':');
			var permissionLevels = permission.split(':');

			if (etalonLevels.length != permissionLevels.length) {
					return false;
			}

			for (var i = 0; i < permissionLevels.length; i++) {
					var pLevel = permissionLevels[i];
					var eLevels = etalonLevels[i].split(',');

					if (eLevels.indexOf('*') < 0 && eLevels.indexOf(pLevel) < 0) {
							return false;
					}
			}

			return true;
		}

		base64urldecode(arg) {
			var s = arg;
			s = s.replace(/-/g, '+'); // 62nd char of encoding
			s = s.replace(/_/g, '/'); // 63rd char of encoding
			switch (s.length % 4) // Pad with trailing '='s
			{
					case 0: break; // No pad chars in this case
					case 2: s += "=="; break; // Two pad chars
					case 3: s += "="; break; // One pad char
					default: throw new Error("Illegal base64url string!");
			}
			return window.atob(s); // Standard base64 decoder
		}

		parseJwtPayload(jwt) {
			var parts = jwt.split(".");
			if (parts.length != 3) {
					throw new Error("JSON Web Token must have three parts");
			}

			var payload = base64urldecode(parts[1]);
			return JSON.parse(payload);
		}		
	}

	return PermissionService;
});
