NEWSCHEMA('OrgUnit', function(schema) {

	schema.define('id', 'String(200)', true);
	schema.define('name', 'String(50)');
	schema.define('groups', '[Group]');
	schema.define('roles', '[Role]');

});