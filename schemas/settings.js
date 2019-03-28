ON('ready', function() {
	DBMS.template('settings', function(builder, $) {
		builder.where('id', $.user.id);
		builder.fields('email,phone,sa,isnotify,istwofactor,iscancel,language,dateformat,timeformat').query('isremoved=false AND isconfirmed=true');
	});
});

NEWSCHEMA('Settings', function(schema) {

	schema.define('email', 'Email', true);
	schema.define('phone', 'Phone');
	schema.define('language', 'String(2)');
	schema.define('dateformat', 'String(20)');
	schema.define('password', 'String(50)');
	schema.define('timeformat', Number);
	schema.define('isnotify', Boolean);
	schema.define('iscancel', Boolean);
	schema.define('istwofactor', Boolean);

	// Reads profile
	schema.setRead(function($) {
		$.DB().read('tbl_user').use('settings', $).callback($.callback);
	});

	// Saves settings
	schema.setSave(function($) {

		var db = $.DB();

		db.read('tbl_user').use('settings', $).orm().data(function(response) {

			var model = $.clean();
			var session = $.user;
			var verify = false;

			if (response.email !== model.email) {

				verify = true;

				// Generates token
				response.verifycode = FUNC.verifycode();
				MAIL(model.email, '@(Verification code) - ' + response.verifycode, 'mails/verify-profile', response, $.language);

				// Caches new email
				session.email2 = model.email;
				model.email = response.email;
			}

			session.dateformat = model.dateformat;
			session.timeformat = model.timeformat;
			session.language = model.language;
			session.iscancel = model.iscancel;

			// Updates session
			MAIN.session.update2($.user.id, session);

			if (model.password && !model.password.startsWith('***'))
				model.password = model.password.sha256();
			else
				model.password = undefined;

			// Saves to DB
			response.dbms.copy(model).save(ERROR('Settings.save'));

			// Responds
			$.success(true, verify ? session.id : undefined);

		}).fail($.callback);
	});

	// Verifies user profile
	schema.addWorkflow('verify', function($) {

		if (!$.user.email2) {
			$.invalid('error-tokeninvalid');
			return;
		}

		$.DB().read('tbl_user').make(function(builder) {

			// Enables ORM
			builder.orm();

			// Conditions
			builder.where('id', $.user.id);

			// Fields
			builder.fields('verifycode', 'email');

			// Callback
			builder.callback(function(err, response) {
				if (response) {
					if (response.verifycode === $.query.code) {

						response.email = $.user.email2;
						$.user.email = $.user.email2;
						delete $.user.email2;

						// ORM: back to the DB
						response.dbms.save($.done());

					} else {
						// What now?
						// Reseting code?
						$.invalid('error-profileverifycode');
					}
				} else
					$.invalid('error-user');
			});
		});
	});

});