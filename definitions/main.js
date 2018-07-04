var MAIN = global.MAIN = {};

MAIN.apps = [];
MAIN.groups = [];
MAIN.languages = [];
MAIN.localities = [];
MAIN.ou = [];
MAIN.roles = [];
MAIN.users = [];
MAIN.ready = false;

MAIN.save = function(callback) {
	callback && callback();
};

MAIN.load = function(callback) {

	var callback = new Callback(4);
	var tmp = {};

	NOSQL('apps').find().callback(function(err, docs) {
		tmp.apps = docs;
		callback.next();
	});

	NOSQL('ou').find().callback(function(err, docs) {
		tmp.ou = docs;
		callback.next();
	});

	NOSQL('groups').find().callback(function(err, docs) {
		tmp.groups = docs;
		callback.next();
	});

	NOSQL('roles').find().callback(function(err, docs) {
		tmp.roles = docs;
		callback.next();
	});

	NOSQL('users').find().callback(function(err, docs) {
		tmp.users = docs;
		callback.next();
	});

	callback.done(function() {

		// parse ou
		// parse groups
		// parse roles
		// parse apps
		// parse users

		MAIN.refresh();
		callback && callback();
		MAIN.ready = true;
	});

};

MAIN.refresh = function() {

	var localities = {};
	var languages = {};

	for (var i = 0; i < MAIN.users.length; i++) {
		var user = MAIN.users[i];

		if (localities[user.locality])
			localities[user.locality]++;
		else
			localities[user.locality] = 1;

		if (languages[user.language])
			languages[user.language]++;
		else
			languages[user.language] = 1;
	}

};