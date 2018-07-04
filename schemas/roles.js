NEWSCHEMA('Role', function(schema) {

	schema.define('id', 'String(30)');
	schema.define('ou', 'String(200)');
	schema.define('name', 'String(30)', true);
	schema.define('body', 'String(500)');

});