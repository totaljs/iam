NEWSCHEMA('Users', function(schema) {

	schema.define('email', 'Email', true);
	schema.define('phone', 'Phone', true);
	schema.define('password', String, true);

	schema.setInsert(function($) {

		var model = $.model;

		DBMS().read('tbl_user').make(function(builder) {
			builder.where('email', model.email);
			builder.where('isremoved', false);
			builder.callback(function(err, response) {

				if (response) {
					$.invalid('error-emailexists');
					return;
				}

				model.id = UID();
				model.login = model.email;
				model.dtcreated = NOW;
				model.dateformat = 'yyyy-MM-dd';
				model.timeformat = 24;
				model.password = model.password.sha256();
				model.verifycode = FUNC.verifycode();
				model.isdeveloper = PREF.defdeveloper == null || PREF.defdeveloper === true;

				DBMS().insert('tbl_user', model).callback(function() {

					if (err) {
						$.invalid(err);
						return;
					}

					// Sends email
					MAIL(model.email, '@(Verification code) - ' + model.verifycode, 'mails/verify', model, $.language);

					// Responds
					$.success(true, model.id);
				});

			});
		});
	});

	schema.addWorkflow('verify', function($) {
		var builder = $.DB().read('tbl_user');

		// Enables ORM
		builder.orm();

		// Conditions
		builder.where('id', $.id);
		builder.query('isconfirmed=FALSE AND isdisabled=FALSE AND isinactive=FALSE AND isremoved=FALSE');

		// Fields
		builder.fields('id', 'verifycode');

		// Callback
		builder.callback(function(err, response) {
			if (response) {
				if (response.verifycode === $.query.code) {

					response.isconfirmed = true;
					response.dtconfirmed = NOW;

					// ORM: back to the DB
					response.dbms.save(function(err, is) {
						// Sign in
						if (is)
							FUNC.authcookie($, response.id, $.done());
						else
							$.success();
					});

				} else {
					// What now?
					// Reseting code?
					$.invalid('error-profileverifycode');
				}
			} else
				$.invalid('error-profile');
		});
	});

	schema.addWorkflow('verify_password', function($) {
		var builder = $.DB().read('tbl_user');

		// Enables ORM
		builder.orm();

		// Conditions
		builder.where('id', $.id);
		builder.query('isconfirmed=TRUE AND isdisabled=FALSE AND isinactive=FALSE AND isremoved=FALSE');

		// Fields
		builder.fields('id', 'verifycode');

		// Callback
		builder.callback(function(err, response) {
			if (response) {
				if (response.verifycode === $.query.code) {

					response.dtconfirmed = NOW;

					// ORM: back to the DB
					response.dbms.save(function(err, is) {
						// Sign in
						if (is)
							FUNC.authcookie($, response.id, $.done());
						else
							$.success();
					});

				} else {
					// What now?
					// Reseting code?
					$.invalid('error-profileverifycode');
				}
			} else
				$.invalid('error-profile');
		});
	});

});

NEWSCHEMA('Users/Login', function(schema) {

	schema.define('login', 'Email', true);
	schema.define('password', 'String(30)', true);

	schema.addWorkflow('exec', function($) {

		var db = $.DB();
		var model = $.clean();

		db.read('tbl_user').where('login', model.login).where('password', model.password.sha256()).query('isremoved=FALSE').fields('id,isdisabled,isconfirmed,istwofactor,isinactive').callback(function(err, response) {

			if (response) {
				if (response.isdisabled)
					$.invalid('error-disabled');
				else if (!response.isconfirmed)
					$.invalid('error-emailconfirm');
				else if (response.isinactive)
					$.invalid('error-inactive');
				else {
					FUNC.device(response.id, $.controller, function(err, device) {
						if (err || !device.isauthorized)
							$.invalid('error-deviceunauthorized');
						else
							FUNC.authcookie($, response.id, $.done());
					});
				}
			} else
				$.invalid('error-credentials');

		});

	});

});

NEWSCHEMA('Users/Resend', function(schema) {

	schema.define('email', 'Email', true);

	schema.addWorkflow('exec', function($) {

		var db = $.DB();
		var model = $.clean();

		db.read('tbl_user').where('email', model.email).where('isremoved=FALSE AND isinactive=FALSE').fields('id,verifycode,isdisabled,isconfirmed').orm('id').callback(function(err, response) {

			if (response) {
				if (response.isdisabled)
					$.invalid('error-disabled');
				else if (response.isconfirmed)
					$.invalid('error-emailconfirmed');
				else if (response.isinactive)
					$.invalid('error-inactive');
				else {
					response.verifycode = FUNC.verifycode();
 					response.dbms.save(function() {
						MAIL(model.email, '@(Verification code) - ' + response.verifycode, 'mails/verify', response, $.language);
						$.success(true, response.id);
					}).fields('verifycode');
				}
			} else
				$.invalid('error-emailaccount');
		});
	});
});

NEWSCHEMA('Users/Password', function(schema) {

	schema.define('email', 'Email', true);

	schema.addWorkflow('exec', function($) {

		var db = $.DB();
		var model = $.clean();

		db.read('tbl_user').where('email', model.email).query('isremoved=FALSE AND isinactive=FALSE').fields('id,verifycode,isdisabled,isconfirmed').orm('id').callback(function(err, response) {
			if (response) {
				if (response.isdisabled)
					$.invalid('error-disabled');
				else if (!response.isconfirmed)
					$.invalid('error-emailconfirm');
				else if (response.isinactive)
					$.invalid('error-inactive');
				else {
					response.verifycode = FUNC.verifycode();
 					response.dbms.save(function() {
						MAIL(model.email, '@(Verification code) - ' + response.verifycode, 'mails/verify', response, $.language);
						$.success(true, response.id);
					}).fields('verifycode');
				}
			} else
				$.invalid('error-emailaccount');
		});
	});
});