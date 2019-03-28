NEWSCHEMA('Profiles', function(schema) {

	schema.define('photo', 'String(50)');
	schema.define('countryid', 'String(3)');
	schema.define('nick', 'String(50)', true);
	schema.define('name', 'String(50)', true);
	schema.define('language', 'String(2)');
	schema.define('firstname', 'String(50)', true);
	schema.define('lastname', 'String(50)', true);
	schema.define('email', 'Email', true);
	schema.define('phone', 'Phone', true);
	schema.define('gender', ['male', 'female']);
	schema.define('url', 'String(100)');
	schema.define('company', 'String(50)');
	schema.define('position', 'String(50)');
	schema.define('address', 'String(50)');
	schema.define('city', 'String(50)');
	schema.define('zip', 'String(20)');
	schema.define('state', 'String(50)');
	schema.define('dateformat', 'String(20)');
	schema.define('timeformat', Number);
	schema.define('dtbirth', Date);

	schema.setQuery(function($) {
		var builder = $.DB().listing('tbl_user_profile').query('isremoved=FALSE').where('userid', $.user.id).callback($.callback).sort('dtcreated', true);
		if ($.query.basic == '1')
			builder.fields('id,name');
	});

	schema.setInsert(function($) {

		var db = $.DB();
		var model = $.clean();

		model.id = UID();
		model.userid = $.user.id;
		model.linker = model.nick.slug();
		model.search = (model.firstname + ' ' + model.lastname + ' ' + model.nick).toSearch().max(80);
		model.dtcreated = NOW;

		if (model.email !== $.user.email) {
			model.email2 = model.email;
			model.email = $.user.email;
			model.verifycode = FUNC.verifycode();
		} else
			model.isconfirmed = true;

		model.rating = FUNC.profilerating(model);
		$.user.countprofiles++;

		db.insert('tbl_user_profile', model).callback(function() {
			if (model.isconfirmed) {
				$.success();
			} else {
				MAIL(model.email, '@(Verification code) - ' + model.verifycode, 'mails/verify-profile', model, $.language);
				$.success(true, model.id);
			}
		});
	});

	schema.setUpdate(function($) {

		var db = DB();
		var model = $.clean();
		var tmp;

		model.dtupdated = NOW;
		model.linker = model.name.slug();
		model.search = (model.firstname + ' ' + model.lastname + ' ' + model.nick).toSearch().max(80);

		if (!model.countryid)
			model.countryid = null;

		if (!model.language)
			model.language = null;

		model.rating = FUNC.profilerating(model);

		// need to know
		// model.isconfirmed
		// model.email

		db.read('tbl_user_profile').where('id', $.id).where('userid', $.user.id).orm().callback(function(err, response) {

			if (err) {
				$.invalid(err);
				return;
			}

			if (response == null) {
				$.invalid('error-profile');
				return;
			}

			var confirm = false;

			if (model.email !== response.email && model.email !== $.user.email) {
				model.verifycode = FUNC.verifycode();
				if (response.isconfirmed) {
					tmp = model.email2 || $.user.email;
					model.email2 = model.email;
					model.email = tmp;
					model.isconfirmed = false;
					confirm = true;
				} else {
					model.email2 = model.email;
					model.email = $.user.email;
					model.isconfirmed = false;
					confirm = true;
				}
			} else if (!response.isconfirmed)
				model.isconfirmed = true;

			response.dbms.replace(model).save().callback(function(err) {
				if (err) {
					$.invalid(err);
				} else {
					if (confirm)
						MAIL($.model.email, '@(Verification code) - ' + model.verifycode, 'mails/verify-profile', model, $.language);
					else
						OPERATION('app_update', { profileid: $.id }, NOOP, $);
					$.success(true, confirm ? $.id : null);
				}
			});

		});
	});

	schema.setRemove(function($) {
		var db = $.DB();
		$.user.countprofiles--;

		DBMS().read('tbl_user_profile').fields('id,isremoved,isconfirmed').where('id', $.id).where('userid', $.user.id).orm('id').query('isremoved=FALSE').callback(function(err, response) {

			if (response == null)
				return $.invalid('error-profile');

			response.isremoved = true;
			response.dtremoved = NOW;

			if (!response.isconfirmed) {
				response.dbms.save($.done());
				return;
			}

			// Unlink all apps
			DBMS().query('SELECT appid FROM tbl_user_session WHERE userid=$1 AND profileid=$2 GROUP BY appid', [$.user.id, $.id]).callback(function(err, sessions) {

				$.params.userid = $.user.id;
				$.params.profileid = $.id;

				sessions.length && db.modify('tbl_user_session', { iscanceled: true }).eq('profileid', 'userid', $.params);
				sessions.wait(function(session, next) {
					$.params.appid = session.appid;
					OPERATION('app_unlink', EMPTYOBJECT, next, $);
				}, () => response.dbms.save($.done()));
			});

		});
	});

	schema.setGet(function($) {
		$.DB().read('tbl_user_profile').where('userid', $.user.id).where('id', $.id).query('isremoved=FALSE').callback($.callback);
	});

	schema.addWorkflow('resend', function($) {
		// Read email
		$.DB().read('tbl_user_profile').where('id', $.id).where('userid', $.user.id).query('isconfirmed=FALSE').fields('verifycode,email2,name').orm().callback(function(err, response) {
			if (response) {
				response.verifycode = FUNC.verifycode();
				response.dbms.save().fields('verifycode').data(function() {
					MAIL(response.email2, '@(Verification code) - ' + response.verifycode, 'mails/verify-profile', response, $.language);
					$.success();
				});
			} else
				$.invalid('error-profile');
		});
	});

	schema.addWorkflow('verify', function($) {
		$.DB().read('tbl_user_profile').make(function(builder) {

			// Enables ORM
			builder.orm();

			// Conditions
			builder.where('id', $.id);
			builder.where('userid', $.user.id);
			builder.query('isconfirmed=FALSE');

			// Fields
			builder.fields('verifycode,email,email2');

			// Callback
			builder.callback(function(err, response) {
				if (response) {
					if (response.verifycode === $.query.code) {

						response.isconfirmed = true;
						response.email = response.email2;

						// ORM: back to the DB
						response.dbms.save($.done());

						// Notifies app
						OPERATION('app_update', { profileid: $.id }, NOOP, $);

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

});