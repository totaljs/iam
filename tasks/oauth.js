NEWTASK('oauth', function(push) {

	// $.value.oauth
	// $.value.user
	// $.value.profile
	// $.value.id

	push('check', function($) {

		var value = $.value;
		var db = DBMS();

		db.read('tbl_user_oauth').where('oauthid', value.oauth.id).where('externalid', value.id).query('isremoved=FALSE').callback(function(err, response) {
			if (response == null)
				$.next('find');
			else if (response.isdisabled)
				$.invalid('error-oauth-disabled');
			else {
				db.modify('tbl_user_oauth', { dtlogged: NOW, accesstoken: $.value.oauth.accesstoken }).where('id', response.id);
				$.done(response);
			}
		});
	});

	push('find', function($) {
		var value = $.value;
		DBMS().read('tbl_user').where('email', value.user.email).query('isremoved=FALSE AND isconfirmed=TRUE AND isinactive=FALSE').callback(function(err, response) {
			if (response) {
				$.value.user = response;
				$.next('extend');
			} else
				$.next('create');
		});
	});

	push('create', function($) {

		var db = DBMS();
		var profile = $.value.profile;
		var user = $.value.user;

		user.id = UID();
		user.isdeveloper = PREF.defdeveloper == null || PREF.defdeveloper === true;
		user.dateformat = 'yyyy-MM-dd';
		user.timeformat = 24;
		user.isconfirmed = true;
		user.dtcreated = NOW;

		var oauth = {};
		oauth.id = UID();
		oauth.oauthid = $.value.oauth.id;
		oauth.userid = user.id;
		oauth.externalid = $.value.id;
		oauth.accesstoken = $.value.oauth.accesstoken;
		oauth.name = profile.nick;
		oauth.email = profile.email;
		oauth.isdisabled = false;
		oauth.dtcreated = NOW;
		oauth.dtlogged = NOW;

		prepare_profile(profile);
		profile.userid = user.id;

		db.begin();
		db.insert('tbl_user', user);
		db.insert('tbl_user_oauth', oauth);
		db.insert('tbl_user_profile', profile);
		db.end();

		db.callback(function(err) {
			if (err)
				$.invalid(err);
			else
				$.done(oauth);
		});
	});

	push('extend', function($) {

		var profile = $.value.profile;
		var user = $.value.user;
		var oauth = {};
		var db = DBMS();

		oauth.id = UID();
		oauth.oauthid = $.value.oauth.id;
		oauth.userid = user.id;
		oauth.externalid = $.value.id;
		oauth.accesstoken = $.value.oauth.accesstoken;
		oauth.name = profile.nick;
		oauth.email = profile.email;
		oauth.isdisabled = false;
		oauth.dtcreated = NOW;
		oauth.dtlogged = NOW;

		db.insert('tbl_user_oauth', oauth);

		db.read('tbl_user_profile').where('userid', user.id).callback(function(err, response) {
			if (response == null) {
				prepare_profile(profile);
				profile.userid = user.id;
				db.insert('tbl_user_profile', profile);
			}
		});

		db.callback(function(err) {
			if (err)
				$.invalid(err);
			else
				$.done(oauth);
		});
	});

	function prepare_profile(profile) {
		profile.id = UID();
		profile.dtcreated = NOW;
		profile.isconfirmed = true;
		profile.dateformat = 'yyyy-MM-dd';
		profile.timeformat = 24;
		profile.name = 'Default profile';
		profile.linker = profile.nick.slug();
		profile.search = (profile.firstname + ' ' + profile.lastname + ' ' + profile.nick).toSearch().max(80);
		profile.rating = FUNC.profilerating(profile);
		return profile;
	}

});