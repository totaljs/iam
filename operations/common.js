NEWOPERATION('confirm', function($) {

	var token = FUNC.token_verify($.params.token);
	if (token == null) {
		$.invalid('error-tokeninvalid');
		return;
	}

	if (token.type === 'C') {

		// create
		DBMS().modify('tbl_user', { isconfirmed: true, dtconfirmed: NOW }).make(function(builder) {
			builder.where('token', token.token);
			builder.query('isremoved=FALSE AND isconfirmed=FALSE and isinactive=FALSE AND isdisabled=FALSE');
			builder.first();
		}).must('error-tokeninvalid').read('tbl_user').make(function(builder) {
			builder.where('token', token.token);
			builder.fields('id');
		}).callback(function(err, response) {
			if (err)
				$.invalid(err);
			else
				FUNC.authcookie($, response.id, () => $.redirect('/profiles/?create=1'));
		});

	} else
		$.invalid('notimplemented');

});

NEWOPERATION('cl', function($) {
	var db = DBMS();
	db.find('cl_language').set('languages');
	db.find('cl_country').set('countries');
	db.callback($.callback);
});

NEWOPERATION('dashboard', function($) {
	var db = DBMS();
	db.find('view_user_session').where('userid', $.user.id).fields('id,profilename,appname,appicon,url,dtaccessed,devicename,devicemobile,dtcreated,dtexpired').sort('dtcreated', true).set('oauthsessions');
	db.find('view_user_logger').where('userid', $.user.id).take(25).fields('id,deviceid,ip,lat,lon,country,countrycode,region,continentcode,continent,city,profilename,appname,appicon,dtcreated,devicename,devicemobile,isdisabled,loggername').sort('dtcreated', true).set('history');
	db.callback(function(err, response) {
		MAIN.session.list($.user.id, function(err, sessions) {
			var data = [];
			for (var i = 0; i < sessions.length; i++) {
				var item = sessions[i];
				data.push({ id: item.sessionid, note: item.note, used: item.used, created: item.created });
			}
			response.sessions = data;
			$.callback(err, response);
		});
	});
});

NEWOPERATION('dashboard_clear', function($) {
	DBMS().remove('tbl_user_logger').where('userid', $.user.id).callback($.done());
});

NEWOPERATION('logout', function($) {

	$.controller.cookie(CONF.cookie, '', '-1 day');

	if ($.user.iscancel) {

		// Cancels all sessions
		MAIN.session.remove2($.user.id);

		// Cancels all app sessions
		OPERATION('app_cancel', null, () => $.redirect('/'), null, $);

	} else {
		MAIN.session.remove($.controller.sessionid);
		$.redirect('/');
	}

});

// Cancels session
NEWOPERATION('app_cancel', function($) {

	// $.params.sessionid

	var db = DBMS();
	var builder = db.find('view_oauth_session');
	builder.where('userid', $.user.id);
	$.params.sessionid && builder.where('id', $.params.sessionid);
	builder.fields('id,profileid,appid,iscanceled,urllogout,client_id');
	builder.callback(function(err, response) {

		var count = 0;

		response.wait(function(item, next) {

			if (item.iscanceled)
				return next();

			// Cancels session
			db.modify('tbl_user_session', { iscanceled: true, dtcanceled: NOW }).prevfilter();

			// Contacts endpoint
			if (item.urllogout) {
				var builder = new RESTBuilder();
				builder.url(item.urllogout);
				builder.get({ code: FUNC.code_create(item, $.user, item.profileid, 'logout', '30 minutes') });
				builder.exec(NOOP);
			}

			count++;
			next();

		}, function() {
			if (count)
				$.success(true, count);
			else
				$.invalid('error-session');
		});
	});

});

// Unlinks a profile from app
NEWOPERATION('app_unlink', function($) {

	var db = DBMS();

	// $.params.appid
	// $.params.profileid

	$.params.userid = $.user.id;

	// Obtains needed data
	db.read('tbl_app').where('id', $.params.appid).query('isremoved=FALSE AND isdisabled=FALSE').fields('id,urlremove').set('app');
	db.must('error-app');
	db.read('tbl_user_profile').where('id', $.params.profileid).where('userid', $.user.id).fields('id').query('isremoved=FALSE AND isconfirmed=TRUE').set('profile');
	db.must('error-profile');

	// Removes all sessions
	db.remove('tbl_user_session').eq('userid', 'appid', 'profileid', $.params).set('countremoved');

	db.callback(function(err, response) {

		if (err) {
			$.invalid(err);
			return;
		}

		// Contacts endpoint
		if (response.app.urlremove) {
			var builder = new RESTBuilder();
			builder.url(response.app.urlremove);
			builder.get({ code: FUNC.code_create({ id: '0', appid: response.app.id }, $.user, response.profile.id, 'remove', '30 minutes') });
			builder.exec(NOOP);
		}

		$.success();
	});

});

// Updates all open session
NEWOPERATION('app_update', function($) {

	var db = DBMS();

	// $.value.profileid

	db.read('view_oauth_session').where('userid', $.user.id).where('profileid', $.value.profileid).query('iscanceled=FALSE AND dtexpired>NOW()').fields('id,appid,urlupdate,client_id').callback(function(err, response) {

		if (!response) {
			$.invalid('error-session');
			return;
		}

		// Contacts endpoint
		if (response.urlupdate) {
			var builder = new RESTBuilder();
			builder.url(response.urlupdate);
			builder.get({ code: FUNC.code_create(response, $.user, response.id, 'update', '30 minutes') });
			builder.exec(NOOP);
		}

	});

	db.callback($.done());
});

NEWOPERATION('device_disable', function($) {
	DBMS().modify('tbl_user_device', { '!isdisabled': 1 }).where('id', $.id).callback($.done());
});

// Cancels internal session
NEWOPERATION('session_cancel', function($) {
	MAIN.session.get($.params.sessionid, function(err, item, meta) {
		if (meta && meta.id === $.user.id) {
			MAIN.session.remove(meta.sessionid);
			$.success(true, meta.sessionid === $.sessionid);
		} else
			$.invalid('error-session');
	});
});

NEWOPERATION('links', function($) {
	$.DB().find('view_user_oauth').where('userid', $.user.id).fields('id,name,email,oauthid,oauthname,oauthcolor,isdisabled,dtlogged,dtcreated').sort('oauthname').callback($.callback);
});

NEWOPERATION('links_disable', function($) {
	$.DB().modify('tbl_user_oauth', { '!isdisabled': 1 }).where('userid', $.user.id).where('id', $.id).callback($.done());
});