// These operations can get a user profile from 3rd party services
// It handles "oauth_request" and "oauth_response"

NEWOPERATION('oauth_request', function($) {

	var db = DBMS();

	db.read('cl_oauth').where('id', $.id).fields('id,client_id,client_secret').query('isdisabled=FALSE AND isremoved=false').callback(function(err, response) {

		if (err) {
			$.invalid(err);
			return;
		}

		if (!response || !response.client_id || !response.client_secret) {
			$.invalid('error-oauth');
			return;
		}

		response.url = CONF.url + '/login/{id}/callback/'.arg(response);
		response.client_id = response.client_id;

		var url = '/login/';

		switch (response.id) {
			case 'facebook':
				url = 'https://graph.facebook.com/oauth/authorize?type=web_server&client_id={client_id}&redirect_uri={url}&scope=email';
				break;
			case 'google':
				url = 'https://accounts.google.com/o/oauth2/auth?scope=email%20profile&redirect_uri={url}&response_type=code&client_id={client_id}';
				break;
			case 'linkedin':
				url = 'https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id={client_id}&redirect_uri={url}&scope=r_liteprofile%20r_emailaddress';
				break;
			case 'yahoo':
				url = 'https://api.login.yahoo.com/oauth2/request_auth?client_id={client_id}&redirect_uri={url}&response_type=code&language=en-us';
				break;
			case 'github':
				url = 'https://github.com/login/oauth/authorize?scope=user%3Aemail&redirect_uri={url}&response_type=code&client_id={client_id}';
				break;
			case 'dropbox':
				url = 'https://www.dropbox.com/1/oauth2/authorize?redirect_uri={url}&response_type=code&client_id={client_id}';
				break;
			case 'live':
				url = 'https://login.live.com/oauth20_authorize.srf?client_id={client_id}&scope=wl.basic%2Cwl.signin%2Cwl.birthday%2Cwl.emails&response_type=code&redirect_uri={url}';
				break;
			case 'yandex':
				url = 'https://oauth.yandex.com/authorize/?response_type=code&client_id={client_id}';
				break;
		}

		$.redirect(url.arg(response, true));
		db.modify('cl_oauth', { dtused: NOW }).where('id', $.id);
	});
});

NEWOPERATION('oauth_response', function($) {

	DBMS().read('cl_oauth').where('id', $.id).callback(function(err, oauth) {

		var builder = new RESTBuilder();
		var url, data;

		oauth.code = $.query.code;
		oauth.url = CONF.url + '/login/{id}/callback/'.arg(oauth);

		switch (oauth.id) {
			case 'facebook':
				url = 'https://graph.facebook.com/oauth/access_token?client_id={client_id}&redirect_uri={url}&client_secret={client_secret}&code={code}';
				builder.get();
				break;
			case 'google':
				url = 'https://www.googleapis.com/oauth2/v3/token';
				break;
			case 'linkedin':
				url = 'https://www.linkedin.com/oauth/v2/accessToken';
				break;
			case 'github':
				url = 'https://github.com/login/oauth/access_token';
				break;
		}

		switch (oauth.id) {
			case 'google':
			case 'github':
			case 'linkedin':
				data = {};
				data.code = oauth.code;
				data.client_id = oauth.client_id;
				data.client_secret = oauth.client_secret;
				data.redirect_uri = oauth.url;
				data.grant_type = 'authorization_code';
				builder.urlencoded(data);
				break;
		}

		builder.url(url.arg(oauth, true));

		builder.exec(function(err, response) {

			if (err) {
				$.invalid(err);
				return;
			}

			if (response.access_token == null) {
				$.invalid('error-accesstoken');
				return;
			}

			oauth.accesstoken = response.access_token;

			var builder = new RESTBuilder();
			builder.header('Authorization', 'Bearer ' + encodeURIComponent(oauth.accesstoken));

			switch (oauth.id) {
				case 'facebook':
					url = 'https://graph.facebook.com/me?fields=email,first_name,last_name,gender,hometown,locale,name,id,timezone,picture';
					break;
				case 'google':
					url = 'https://www.googleapis.com/plus/v1/people/me';
					break;
				case 'github':
					url = 'https://api.github.com/user';
					break;
				case 'linkedin':
					url = 'https://api.linkedin.com/v2/me';
					break;
			}


			builder.url(url);
			builder.exec(function(err, response) {

				if (err) {
					$.invalid(err);
					return;
				}

				// Processes profile
				switch (oauth.id) {
					case 'facebook':
						process_facebook($, oauth, response);
						return;
					case 'google':
						process_google($, oauth, response);
						return;
					case 'github':
						process_github($, oauth, response);
						return;
					case 'linkedin':
						process_linkedin($, oauth, response);
						return;
				}

				$.invalid('error-oauth');
			});
		});
	});
});

function process_facebook($, oauth, response) {

	var model = {};

	model.oauth = oauth;
	model.id = response.id;

	var user = model.user = {};
	user.login = response.email;
	user.email = response.email;
	user.phone = '';

	var profile = model.profile = {};
	profile.firstname = response.first_name;
	profile.lastname = response.last_name;
	profile.nick = response.name;
	profile.email = response.email;

	// @TODO: make photo
	// picture: { data: { height: 50, is_silhouette: false, url: 'https://platform-lookaside.fbsbx.com/platform/profilepic/?asid=10219263790571926&height=50&width=50&ext=1555531697&hash=AeQFMlk_dV5evNUH', width: 50 } } }

	TASK('oauth', 'check', function(err, response) {

		// User will be logged
		response && login($, response.userid, 'Facebook');
		$.redirect('/');

	}, $).value = model;
}

function process_google($, oauth, response) {

	var model = {};

	model.oauth = oauth;
	model.id = response.id;

	var user = model.user = {};
	response.email = response.emails[0].value;

	user.login = response.email;
	user.email = response.email;
	user.phone = '';

	var profile = model.profile = {};
	profile.firstname = response.name.givenName;
	profile.lastname = response.name.familyName;
	profile.nick = response.displayName;
	profile.email = response.email;

	// @TODO: make photo
	// image: { url: 'https://lh6.googleusercontent.com/-qJtxCwBkVcg/AAAAAAAAAAI/AAAAAAAAAeY/Mn8ABMy5BJE/s50/photo.jpg', isDefault: false }

	TASK('oauth', 'check', function(err, response) {

		// User will be logged
		response && login($, response.userid, 'Google');
		$.redirect('/');

	}, $).value = model;
}

function process_github($, oauth, response) {

	if (!response.email) {
		$.invalid('error-oauthemail');
		return;
	}

	var model = {};
	model.oauth = oauth;
	model.id = response.id + '';

	var user = model.user = {};
	user.login = response.email;
	user.email = response.email;
	user.phone = '';

	var profile = model.profile = {};
	var name = response.name.split(' ');
	profile.nick = response.name;
	profile.firstname = name[0] || '';
	profile.lastname = name[1] || '';
	profile.email = response.email;
	profile.company = response.company;
	profile.url = response.blog;

	// @TODO: make photo
	//  avatar_url: 'https://avatars3.githubusercontent.com/u/2414252?v=4',

	TASK('oauth', 'check', function(err, response) {

		// User will be logged
		response && login($, response.userid, 'GitHub');
		$.redirect('/');

	}, $).value = model;
}

function process_linkedin($, oauth, response) {

	RESTBuilder.url('https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))').header('Authorization', 'Bearer ' + encodeURIComponent(oauth.accesstoken)).exec(function(err, data) {

		if (data.elements && data.elements[0] && data.elements[0]['handle~'])
			response.email = data.elements[0]['handle~'].emailAddress;

		if (!response.email) {
			$.invalid('error-oauthemail');
			return;
		}

		var loc = response.firstName.preferredLocale;
		var key = loc.language + '_' + loc.country;
		var model = {};

		model.oauth = oauth;
		model.id = response.id + '';

		var user = model.user = {};
		user.login = response.email;
		user.email = response.email;
		user.phone = '';

		var profile = model.profile = {};
		profile.firstname = response.firstName.localized[key] || '';
		profile.lastname = response.lastName.localized[key] || '';
		profile.nick = profile.firstname + ' ' + profile.lastname;
		profile.email = response.email;

		// @TODO: make photo
		//  avatar_url: 'https://avatars3.githubusercontent.com/u/2414252?v=4',

		TASK('oauth', 'check', function(err, response) {

			// User will be logged
			response && login($, response.userid, 'LinkedIn');
			$.redirect('/');

		}, $).value = model;
	});
}

function login($, id, name) {
	var opt = {};
	opt.id = id;
	opt.name = CONF.cookie;
	opt.key = CONF.authkey;
	opt.expire = '1 month';
	opt.data = null;
	opt.note = name + ': ' + ($.headers['user-agent'] || '').parseUA();
	MAIN.session.setcookie($.controller, opt);
}