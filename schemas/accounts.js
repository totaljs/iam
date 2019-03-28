NEWSCHEMA('Accounts', function(schema) {

	schema.setQuery(function($) {
		DBMS().query('SELECT * FROM fn_userapps($1) ORDER BY name', [$.user.id]).callback($.callback);
	});

	schema.addWorkflow('profiles', function($) {
		DBMS().query('SELECT * FROM fn_userappsprofiles($1, $2) ORDER BY name', [$.user.id, $.id]).callback($.callback);
	});

});