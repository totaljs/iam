exports.install = function() {

	// Dashboard
	ROUTE('GET  /api/dashboard/', ['*Dashboard --> @query']);

	// Users
	ROUTE('GET  /api/users/',     ['*User --> @query']);
	ROUTE('POST /api/users/',     ['*User --> @insert']);

	// Products
	ROUTE('GET  /api/products/',  ['*Product --> @query']);

};