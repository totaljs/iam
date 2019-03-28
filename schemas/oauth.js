NEWSCHEMA('OAuth/Authorize', function(schema) {

	// Fields
	schema.define('appid', 'UID', true);
	schema.define('profileid', 'UID', true);
	schema.define('client_id', String, true);

	// Workflows
	schema.addWorkflow('exec', function($) {
		var model = $.clean();

		FUNC.device($.user.id, $.controller, function(err, device) {

			var db = $.DB();

			db.read('tbl_user_profile').make(function(builder) {
				builder.where('userid', $.user.id);
				builder.where('id', model.profileid);
				builder.fields('id');
			});

			db.must('error-userprofile');

			db.read('view_oauth_session').make(function(builder) {

				builder.where('deviceid', device.id);
				builder.where('profileid', model.profileid);
				builder.where('client_id', model.client_id);
				builder.where('dtexpired', '>', NOW);
				builder.query('iscanceled=FALSE');
				builder.fields('appid,fields,iscanceled,urlcallback,client_id');

				builder.callback(function(err, response) {

					if (response) {
						db.modify('tbl_user_session', { '+countaccessed': 1, fields: response.fields, dtaccessed: NOW }).where('id', response.id).first();
						FUNC.logger('authorize', $.user.id, $.controller, device.id, model.profileid, response.appid);
					} else {
						// Read app data
						db.read('tbl_app').fields('id,fields,urlcallback,client_id').where('client_id', model.client_id).query('isdisabled=FALSE AND isremoved=FALSE').callback(function(err, response) {
							if (response) {
								var data = {};
								data.id = UID();
								data.userid = $.user.id;
								data.appid = response.id;
								data.deviceid = device.id;
								data.profileid = model.profileid;
								data.bearer = data.id + '_' + U.GUID(45) + NOW.getTime();
								data.fields = response.fields;
								data.dtexpired = NOW.add('1 month');
								data.countaccessed = 1;
								data.dtaccessed = NOW;
								data.dtcreated = NOW;
								db.insert('tbl_user_session', data);

								// Caches response
								db.response.view_oauth_session = CLONE(data);
								db.response.view_oauth_session.urlcallback = response.urlcallback;

								// Logs authorization
								FUNC.logger('authorize', data.userid, $.controller, data.deviceid, data.profileid, data.appid);

							} else
								$.invalid('error-app');
						});
					}

				});

			});

			db.callback(function(err) {
				if (err)
					$.callback();
				else {
					var app = db.response.view_oauth_session;
					$.success(app.urlcallback + '?code=' + FUNC.code_create(app, $.user, model.profileid));
				}
			});
		});
	});

});

NEWSCHEMA('OAuth/Token', function(schema) {

	schema.addWorkflow('exec', function($) {

		var code = FUNC.code_verify($.query.code);

		// $.query.code
		// $.query.client_id
		// $.query.client_secret

		$.error.setTransform('simple');

		if (code == null) {
			$.invalid('error-accesstoken');
			return;
		}

		var db = $.DB();

		db.read('tbl_app').make(function(builder) {
			builder.where('id', code.appid);
			builder.where('client_id', $.query.client_id || '');
			builder.where('client_secret', $.query.client_secret || '');
			builder.query('isremoved=FALSE AND isdisabled=FALSE AND isinactive=FALSE AND isconfirmed=TRUE');
		});

		db.must('error-accesstoken');

		if (code.sessionid !== '0') {
			db.read('tbl_user_session').make(function(builder) {
				builder.where('id', code.sessionid);
				builder.where('appid', code.appid);
				builder.where('userid', code.userid);
				builder.query('isremoved=FALSE');
				builder.fields('bearer,dtexpired');
			});
			db.must('error-userapp');
		}

		db.callback(function(err, response) {

			if (err)
				$.callback();
			else {

				var obj = {};

				obj.status = 200;

				// Removes
				if (code.sessionid === '0') {
					obj.type = code.type;
					obj.userid = code.profileid;
					$.callback(obj);
					return;
				}

				obj.access_token = response.bearer;
				obj.token_type = 'bearer';
				obj.expires_in = ((response.dtexpired - NOW) / 1000) >> 0;

				if (code.sessionid && code.sessionid !== '0')
					obj.sessionid = code.sessionid;

				if (code.type) {
					obj.type = code.type;
					obj.userid = code.profileid;
				}

				$.callback(obj);
			}
		});

	});

});

// Custom error handling
function err_fields(val) {
	var a = FUNC.fields(val.fields);
	var b = FUNC.fields(val.fieldsmain);
	return a !== b ? 'error-userauthorizeagain' : true;
}

NEWSCHEMA('OAuth/Profile', function(schema) {

	schema.addWorkflow('exec', function($) {

		$.error.setTransform('simple');

		var bearer = $.controller.req.headers.authorization || '';

		bearer = bearer.substring(bearer.indexOf(' ') + 1).trim();

		if (!bearer) {
			$.invalid('error-appbearer');
			return;
		}

		var db = $.DB();

		db.read('view_oauth_session').make(function(builder) {
			builder.where('id', bearer.substring(0, bearer.indexOf('_')) || '');
			builder.where('bearer', bearer);
			builder.fields('id,profileid,iscanceled,fields,fieldsmain,dtexpired,dtcanceled');
		});

		// Error handling
		db.must('error-appbearer');
		db.must(err_fields);

		db.read('tbl_user_profile').make(function(builder) {
			builder.where('id', db.get('view_oauth_session.profileid'));
			builder.where('isremoved', false);
		});

		db.callback(function(err, response) {

			if (err) {
				$.callback();
				return;
			}

			var output = {};
			var app = db.response.view_oauth_session;

			if (app.iscanceled) {
				output.type = 'logout';
				output.id = response.id;
				output.iscanceled = true;
				output.nick = response.nick;
				output.dtexpired = app.dtcanceled;
				output.sessionid = app.id;
				$.callback(output);
				return;
			}

			var fields = app.fieldsmain.split(',');

			output.type = 'login';
			output.id = response.id;
			output.sessionid = app.id;
			output.dtcreated = response.dtcreated;
			output.dtupdated = response.dtupdated;
			output.rating = response.rating;

			for (var i = 0; i < fields.length; i++) {
				var field = fields[i];
				output[field] = response[field];
			}

			// Responds
			$.callback(output);

			// Updates last usage
			DBMS().modify('tbl_user_session', { dtaccessed: NOW, '+countaccessed': 1, dtexpired: NOW.add('1 month') }).where('id', app.id).first();
		});

	});

});