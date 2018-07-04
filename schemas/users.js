NEWSCHEMA('User', function(schema) {

	schema.define('id', 'UID');
	schema.define('token', 'String(50)');
	schema.define('supervisorid', 'UID');
	schema.define('photo', 'String(200)');
	schema.define('name', 'String(40)');
	schema.define('firstname', 'Capitalize(40)', true);
	schema.define('lastname', 'Capitalize(40)', true);
	schema.define('gender', ['male', 'female']);
	schema.define('email', 'Email', true);
	schema.define('phone', 'Phone');
	schema.define('company', 'String(40)');
	schema.define('ou', 'String(200)');
	schema.define('language', 'String(2)');
	schema.define('reference', 'String(40)');
	schema.define('locality', 'String(80)');
	schema.define('login', 'String(120)');
	schema.define('password', 'String(50)');
	schema.define('roles', '[String]');
	schema.define('groups', '[String]');
	schema.define('apps', '[UID]');
	schema.define('notes', 'String(200)');
	schema.define('blocked', Boolean);
	schema.define('customer', Boolean);
	schema.define('notifications', Boolean);
	schema.define('sa', Boolean);
	schema.define('inactive', Boolean);
	schema.define('confirmed', Boolean);
	schema.define('sounds', Boolean);
	schema.define('datebirth', Date);
	schema.define('datebeg', Date);
	schema.define('dateend', Date);

	schema.setQuery(function($) {

		var arr = [];

		for (var i = 0; i < 10; i++)
			arr.push({ name: 'User ' + U.GUID(10) });

		$.callback(arr);
	});

	schema.setSave(function($) {

		var model = $.clean();
		var user;
		var newbie = false;

		if (model.id) {
			newbie = true;
			user = MAIN.users.findItem('id', model.id);
			if (user == null) {
				$.invalid('error-users');
				return;
			}
		} else {
			user = {};
			user.id = UID();
			MAIN.users.push(user);
		}

		// Copies data
		U.copy(model, user);

		// Perform update
		MAIN.refresh();
		MAIN.save();

		EMIT(newbie ? 'users.create' : 'users.update', user);
		$.success();
	});

});