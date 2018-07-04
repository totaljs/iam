exports.install = function() {

	// Dashboard
	ROUTE('GET  /api/dashboard/', ['*Dashboard --> @query']);

	// Users
	ROUTE('GET  /api/users/',     ['*User --> @query']);
	ROUTE('POST /api/users/',     ['*User --> @insert']);

	// Products
	ROUTE('GET  /api/products/',  ['*Product --> @query']);

	ROUTE('GET     /api/cl/                    *Common --> @codelist');

	ROUTE('GET     /api/accounts/              *Account --> @query');
	ROUTE('GET     /api/accounts/{id}/         *Account --> @get');
	ROUTE('POST    /api/accounts/              *Account --> @insert');
	ROUTE('PUT     /api/accounts/{id}/         *Account --> @update');
	ROUTE('DELETE  /api/accounts/{id}/         *Account --> @remove');
	ROUTE('GET     /api/accounts/current/      *Account --> @current');
};