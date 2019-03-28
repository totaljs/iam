exports.install = function() {

	// Authorized
	GROUP(['authorize'], function() {

		// Settings
		ROUTE('GET     /api/settings/                             *Settings        --> @read');
		ROUTE('GET     /api/settings/verify/                      *Settings        --> @verify');
		ROUTE('POST    /api/settings/                             *Settings        --> @save');

		// Users
		ROUTE('GET     /api/users/                                *Users           --> @query');
		ROUTE('POST    /api/users/{id}/                           *Users           --> @update');
		ROUTE('DELETE  /api/users/{id}/                           *Users           --> @remove');

		// Links
		ROUTE('GET     /api/links/                                *                --> @links');
		ROUTE('GET     /api/links/{id}/disable/                   *                --> @links_disable');

		// Accounts
		ROUTE('GET     /api/accounts/                             *Accounts        --> @query');
		ROUTE('GET     /api/accounts/{id}/profiles/               *Accounts        --> @profiles');

		// Profiles
		ROUTE('GET     /api/profiles/                             *Profiles        --> @query');
		ROUTE('GET     /api/profiles/{id}/                        *Profiles        --> @read');
		ROUTE('POST    /api/profiles/                             *Profiles        --> @insert');
		ROUTE('POST    /api/profiles/{id}/                        *Profiles        --> @update');
		ROUTE('DELETE  /api/profiles/{id}/                        *Profiles        --> @remove', [10000]); // 10 seconds timeout
		ROUTE('GET     /api/profiles/{id}/resend/                 *Profiles        --> @resend');
		ROUTE('GET     /api/profiles/{id}/verify/                 *Profiles        --> @verify');
		ROUTE('GET     /api/profiles/{id}/disable/                *Profiles        --> @disable');

		// Apps
		ROUTE('GET     /api/apps/                                 *Apps            --> @query');
		ROUTE('POST    /api/apps/                                 *Apps            --> @insert');
		ROUTE('GET     /api/apps/{id}                             *Apps            --> @read');
		ROUTE('POST    /api/apps/{id}                             *Apps            --> @update');
		ROUTE('DELETE  /api/apps/{id}                             *Apps            --> @remove');

		// Admin/Apps
		ROUTE('GET     /api/admin/apps/                           *Admin/Apps      --> @query');
		ROUTE('GET     /api/admin/apps/{id}                       *Admin/Apps      --> @read');
		ROUTE('POST    /api/admin/apps/{id}                       *Admin/Apps      --> @update');
		ROUTE('DELETE  /api/admin/apps/{id}                       *Admin/Apps      --> @remove');
		ROUTE('GET     /api/admin/apps/{id}/confirm/              *Admin/Apps      --> @confirm');
		ROUTE('GET     /api/admin/apps/{id}/disable/              *Admin/Apps      --> @disable');
		ROUTE('GET     /api/admin/apps/{id}/active/               *Admin/Apps      --> @active');

		// Admin/Apps
		ROUTE('GET     /api/admin/users/                           *Admin/Users    --> @query');
		ROUTE('GET     /api/admin/users/{id}                       *Admin/Users    --> @read');
		ROUTE('POST    /api/admin/users/{id}                       *Admin/Users    --> @update');
		ROUTE('DELETE  /api/admin/users/{id}                       *Admin/Users    --> @remove');
		ROUTE('GET     /api/admin/users/{id}/confirm/              *Admin/Users    --> @confirm');
		ROUTE('GET     /api/admin/users/{id}/developer/            *Admin/Users    --> @developer');
		ROUTE('GET     /api/admin/users/{id}/active/               *Admin/Users    --> @active');
		ROUTE('GET     /api/admin/users/{id}/sa/                   *Admin/Users    --> @sa');

		// Admin/Oauth
		ROUTE('GET     /api/admin/oauth/                          *Admin/OAuth     --> @query');
		ROUTE('GET     /api/admin/oauth/{id}                      *Admin/OAuth     --> @read');
		ROUTE('POST    /api/admin/oauth/{id}                      *Admin/OAuth     --> @update');
		ROUTE('GET     /api/admin/oauth/{id}/toggle/              *Admin/OAuth     --> @toggle');

		// Admin/Apps
		ROUTE('GET     /api/admin/settings/                       *Admin/Settings  --> @get');
		ROUTE('POST    /api/admin/settings/                       *Admin/Settings  --> @save');

		// Common operations
		ROUTE('GET     /api/dashboard/                            *                --> @dashboard');
		ROUTE('GET     /api/dashboard/clear/                      *                --> @dashboard_clear');
		ROUTE('GET     /api/cl/                                   *                --> @cl');
		ROUTE('GET     /logout/                                   *                --> @logout', [10000]);

		// Internal operations
		ROUTE('GET     /api/internal/cancel/{sessionid}/internal/ *                --> @session_cancel');
		ROUTE('GET     /api/internal/cancel/{sessionid}/          *                --> @app_cancel');
		ROUTE('GET     /api/internal/unlink/{profileid}/{appid}/  *                --> @app_unlink');
		ROUTE('GET     /api/internal/disable/{id}/                *                --> @device_disable');

		// Other
		ROUTE('POST /api/upload/base64/', upload, 1024); // 5 MB
	});

	// Not authorized
	GROUP(['unauthorize'], function() {
		ROUTE('POST    /api/users/login/                          *Users/Login     --> @exec');
		ROUTE('POST    /api/users/create/                         *Users           --> @insert');
		ROUTE('POST    /api/users/password/                       *Users/Password  --> @exec');
		ROUTE('POST    /api/users/resend/                         *Users/Resend    --> @exec');
		ROUTE('GET     /api/users/{id}/verify/                    *Users           --> @verify');
		ROUTE('GET     /api/users/{id}/verify/password/           *Users           --> @verify_password');
	});

	// Global operations
	ROUTE('GET     /confirm/{token}/                              *                --> @confirm');
};

function upload() {

	var self = this;
	var buffer = (self.body.file || '').base64ToBuffer();

	if (!buffer) {
		self.throw400();
		return;
	}

	FILESTORAGE('photos').insert('photo.jpg', buffer, function(err, id) {
		if (err)
			self.invalid(err);
		else
			self.json('/photos/{0}.jpg'.format(id));
	});

}