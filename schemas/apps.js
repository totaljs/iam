NEWSCHEMA('App', function(schema) {

	schema.define('id', 'UID');
	schema.define('token', 'String(50)');
	schema.define('name', 'String(30)', true);
	schema.define('redirecturl', 'String(200)', true);
	schema.define('permissions', '[String(30)]');

});