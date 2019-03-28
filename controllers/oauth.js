exports.install = function() {

	// Public API
	ROUTE('GET  /oauth/authorize/',                oauth_authorize);
	ROUTE('GET  /oauth/token/                      *OAuth/Token       --> @exec');
	ROUTE('GET  /oauth/profile/                    *OAuth/Profile     --> @exec');

	// Internal API for OAuth
	ROUTE('POST /api/oauth/authorize/              *OAuth/Authorize   --> @exec', ['authorize']);
};

function oauth_authorize() {

	var self = this;
	var query = self.query;

	// 1. user must be logged
	// 2. check if the user has token

	if (!query.client_id) {
		self.invalid('error-appclientid');
		return;
	}

	if (!self.user) {
		self.redirect('/login/?url=' + encodeURIComponent(self.uri.href));
		return;
	}

	if (!self.user.countprofiles) {
		self.redirect('/profiles/?url=' + encodeURIComponent(self.uri.href));
		return;
	}

	// returns token
	DBMS().read('tbl_app').where('client_id', query.client_id).query('isconfirmed=TRUE AND isremoved=FALSE').callback(function(err, app) {

		if (!app) {
			self.invalid('error-appclientid');
			return;
		}

		if (app.isdisabled) {
			// app is disabled
			self.invalid('error-app-disabled');
			return;
		}

		if (app.isinactive) {
			// app is inactive
			self.invalid('error-app-inactive');
			return;
		}

		FUNC.device(self.user.id, self, function(err, device) {
			DBMS().read('view_oauth_session').fields('id,appid,profileid,userid,fieldsmain,fields').where('appid', app.id).where('userid', self.user.id).where('deviceid', device.id).query('iscanceled=FALSE').callback(function(err, response) {

				// App is authorized
				if (response) {

					if (FUNC.fields(response.fields) === FUNC.fields(response.fieldsmain)) {
						// @TODO: how to switch between multiple profiles?
						FUNC.logger('authorize', response.userid, self, device.id, response.profileid, response.appid);
						self.redirect(app.urlcallback + '?code=' + FUNC.code_create(response, self.user, response.profileid));
						return;

					} else
						app.modified = true;

					app.profileid = response.profileid || '';
				}

				app.fields = app.fields.split(',');
				app.permissions = {};
				app.permissions.basic = [];
				app.permissions.personal = [];
				app.permissions.contact = [];
				app.permissions.location = [];

				for (var i = 0; i < app.fields.length; i++) {
					var key = app.fields[i];
					switch (key) {
						case 'name':
						case 'photo':
						case 'position':
							app.permissions.basic.push(key);
							break;
						case 'dtbirth':
						case 'gender':
						case 'firstname':
						case 'lastname':
						case 'company':
							app.permissions.personal.push(key);
							break;
						case 'email':
						case 'phone':
						case 'url':
							app.permissions.contact.push(key);
							break;
						case 'address':
						case 'city':
						case 'zip':
						case 'countryid':
						case 'country':
						case 'state':
							app.permissions.location.push(key);
							break;
					}
				}

				// User must authorize app
				self.view('auth', app);
			});
		});
	});
}