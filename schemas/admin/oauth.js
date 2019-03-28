NEWSCHEMA('Admin/OAuth', function(schema) {

	schema.define('client_id', 'String(100)');
	schema.define('client_secret', 'String(100)');
	schema.define('isdisabled', Boolean);

	schema.setQuery(function($) {
		if (!FUNC.unauthorized($))
			$.DB().find('cl_oauth').fields('id,name,client_id,client_secret,isdisabled,dtused').sort('name').callback($.callback);
	});

	schema.setUpdate(function($) {

		if (FUNC.unauthorized($))
			return;

		$.DB().read('cl_oauth').where('id', $.id).orm().must('error–adminoauth').callback(function(err, response) {
			if (response) {
				response.dtupdated = NOW;
				response.dbms.copy($.clean()).save($.done());
			} else
				$.invalid(err);
		});
	});

	schema.addWorkflow('toggle', function($) {
		if (!FUNC.unauthorized($))
			$.DB().modify('cl_oauth', { '!isdisabled': 1, dtupdated: NOW }).where('id', $.id).callback($.done());
	});

});