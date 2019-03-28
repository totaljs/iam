exports.install = function() {
	ROUTE('/*', 'index', ['authorize']);
	ROUTE('/*', 'homepage', ['unauthorize']);

	ROUTE('/login/', login, ['unauthorize']);

	// Sign-in with 3rd party service
	ROUTE('/login/{id}/             *  --> @oauth_request',  ['unauthorize']);
	ROUTE('/login/{id}/callback/    *  --> @oauth_response', ['unauthorize', 8000]);

	// File routes
	FILE('/manifest.json', manifest);
	FILE('/photos/*.jpg', photo);

	ROUTE('/usage/', function() {
		this.json(F.usage(true));
	});
};

function manifest(req, res) {
	res.content(200, '{"name":"{0}","short_name":"{0}","icons":[{"src":"/img/icon.png","sizes":"500x500","type":"image/png"}],"start_url":"/","display":"standalone"}'.format(CONF.name), U.getContentType('json'));
}

function photo(req, res) {
	var id = req.split[1].replace(/\.jpg/, '');
	res.filefs('photos', id);
}

function login() {
	DBMS().find('cl_oauth').fields('id,name,color').sort('name').query('isdisabled=FALSE').callback(this.callback('login'));
}