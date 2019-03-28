const SESSIONOPTIONS = { name: CONF.cookie, key: CONF.authkey, expire: '1 month' };

AUTH(function($) {
	MAIN.session.getcookie($, SESSIONOPTIONS, function(err, user, meta, init) {

		if (user == null) {
			$.invalid();
			return;
		}

		if (init) {
			FUNC.device(user.id, $.req, function(err, device) {
				if (err || !device.isauthorized) {
					MAIN.session.remove(meta);
					$.invalid();
				} else {
					FUNC.logger('login', user.id, $.req, device.id);
					DBMS().modify('tbl_user', { isonline: true, dtlogged: NOW }).where('id', user.id);
					$.success(user);
				}
			});
		} else
			$.success(user);
	});
});

// Clears expired sessions
ON('service', function(counter) {
	if (counter % 5 === 0) {
		MAIN.session.releaseunused('2 hours');
	}
});