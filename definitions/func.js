FUNC.code_create = function(session, user, profileid, type, expire) {
	var code = U.GUID(30);
	code += 'x' + (code + session.appid + profileid + user.id + session.client_id).crc32(true);
	CACHE(code, { type: type, sessionid: session.id, appid: session.appid, userid: user.id, profileid: profileid }, expire || '1 minute', true);
	return code;
};

FUNC.code_verify = function(code) {
	return code ? CACHE(code) : null;
};

FUNC.verifycode = function() {
	return ((1000 + (Math.random() * 99999) >> 0) + '').substring(0, 4);
};

FUNC.fields = function(fields) {

	var output = {};
	fields = fields.split(',');

	for (var i = 0; i < fields.length; i++) {
		var key = fields[i];
		switch (key) {
			case 'name':
			case 'photo':
			case 'position':
				output.basic = 1;
				break;
			case 'dtbirth':
			case 'gender':
			case 'firstname':
			case 'lastname':
			case 'company':
				output.personal = 1;
				break;
			case 'email':
			case 'phone':
			case 'url':
				output.contact = 1;
				break;
			case 'address':
			case 'city':
			case 'zip':
			case 'countryid':
			case 'country':
			case 'state':
				output.location = 1;
				break;
		}
	}

	var keys = Object.keys(output);
	keys.sort();
	return keys.join(',');
};

FUNC.profilerating = function(profile) {
	var fields = GETSCHEMA('Profiles').fields;
	var rating = 0;
	for (var i = 0; i < fields.length; i++) {
		var key = fields[i];
		if (key !== 'state') {
			var val = profile[key];
			rating += val ? 1 : 0;
		}
	}
	return Math.ceil((rating / (fields.length - 1)) * 100);
};

FUNC.geoip = function(ip, callback) {
	DBMS().read('cl_ip').where('id', ip).callback(function(err, response) {

		var type = 0;

		if (response == null) {
			// create
			type = 1;
		} else if (response.dtcreated < NOW.add('-5 days')) {
			// update
			type = 2;
		} else {
			// last state
			callback(null, response);
			return;
		}

		RESTBuilder.make(function(builder) {
			builder.url('https://api.ipdata.co/{0}?api-key={1}'.format(ip, CONF.geoipkey));
			builder.get();
			builder.exec(function(err, response) {

				if (err) {
					callback(err, null);
					return;
				}

				var model = {};

				if (type === 1) {
					model.id = ip;
					model.dtcreated = NOW;
				}

				model.city = response.city;
				model.country = response.country_name;
				model.countrycode = response.country_code;
				model.continent = response.continent_name;
				model.continentcode = response.continent_code;
				model.lat = response.latitude;
				model.lon = response.longitude;
				model.zip = response.postal;
				model.region = response.region;
				model.regioncode = response.region_code;
				model.code = response.calling_code;
				model.dtupdated = NOW;

				var db = DBMS();

				if (type === 1)
					db.insert('cl_ip', model);
				else
					db.update('cl_ip', model).where('id', ip);

				callback(null, model);
			});
		});

	});

};

FUNC.logger = function(loggerid, userid, controller, deviceid, profileid, appid) {

	var obj = {};

	obj.id = UID('logger');
	obj.loggerid = loggerid;
	obj.userid = userid;
	obj.ismobile = controller.mobile;
	obj.dtcreated = NOW;
	obj.profileid = profileid || null;
	obj.appid = appid || null;
	obj.deviceid = deviceid || null;
	obj.ip = controller.ip;

	// GeoIP
	FUNC.geoip(obj.ip, function(err, geo) {

		if (geo) {
			obj.city = geo.city;
			obj.region = geo.region;
			obj.regioncode = geo.regioncode;
			obj.country = geo.country;
			obj.countrycode = geo.countrycode;
			obj.continent = geo.continent;
			obj.continentcode = geo.continentcode;
			obj.lat = geo.lat;
			obj.lon = geo.lon;
			obj.zip = geo.zip;
			obj.isgeoip = true;
		}

		DBMS().insert('tbl_user_logger', obj);
	});
};

FUNC.device = function(userid, controller, callback) {

	// @userid {String}
	// @controller {Controller/Request}

	var ua = (controller.isController ? controller.req.headers : controller.headers)['user-agent'] || '';
	var uid = ua.parseUA();
	var device = {};

	device.id = userid + '_' + uid.crc32(true);
	device.ua = ua.max(150);
	device.uid = uid.max(100);
	device.ismobile = controller.mobile;
	device.userid = userid;

	DBMS().query('SELECT fn_device($1) as isauthorized', [JSON.stringify(device)]).callback(function(err, response) {

		// Assigns device ID to the "response"
		if (response)
			response.id = device.id;

		callback(err, response);

	}).first();

};

FUNC.unauthorized = function($) {
	if (!$.user.sa) {
		$.invalid('error-permissions');
		return true;
	}
};

FUNC.notdeveloper = function($) {
	if (!$.user.isdeveloper) {
		$.invalid('error-permissions');
		return true;
	}
};

FUNC.authcookie = function($, userid, callback) {
	var opt = {};
	opt.id = userid;
	opt.name = CONF.cookie;
	opt.key = CONF.authkey;
	opt.expire = '1 month';
	opt.data = null;
	opt.note = ($.headers['user-agent'] || '').parseUA();
	MAIN.session.setcookie($.controller, opt, callback);
};