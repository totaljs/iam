NEWSCHEMA('Admin/Users', function(schema) {

	schema.define('email', 'Email', true);
	schema.define('phone', 'Phone', true);
	schema.define('sa', Boolean);
	schema.define('language', 'String(2)');
	schema.define('isnotify', Boolean);
	schema.define('isdeveloper', Boolean);
	schema.define('isconfirmed', Boolean);
	schema.define('isverified', Boolean);
	schema.define('isdisabled', Boolean);
	schema.define('isinactive', Boolean);
	schema.define('istwofactor', Boolean);
	schema.define('dateformat', 'String(20)');
	schema.define('timeformat', Number);

	schema.setQuery(function($) {

		if (FUNC.unauthorized($))
			return;

		var builder = DBMS().list('view_user');
		builder.fields('id,language,email,phone,sa,istwofactor,isnotify,isonline,isdeveloper,isconfirmed,isdisabled,dtcreated,dtupdated,dtconfirmed,dtlogged,countprofiles');
		builder.paginate(1, 50);
		builder.sort('dtcreated', true);
		builder.callback($.callback);
	});

	schema.addWorkflow('confirm', function($) {

		if (FUNC.unauthorized($))
			return;

		$.DB().read('tbl_user').fields('isconfirmed').where('id', $.id).query('isremoved=FALSE').orm('id').callback(function(err, response) {
			if (response) {
				response.isconfirmed = !response.isconfirmed;
				response.dbms.save($.done());
			} else
				$.invalid('error-user');
		});
	});

	schema.addWorkflow('active', function($) {

		if (FUNC.unauthorized($))
			return;

		$.DB().read('tbl_user').fields('isinactive').where('id', $.id).query('isremoved=FALSE').orm('id').callback(function(err, response) {
			if (response) {
				response.isinactive = !response.isinactive;
				response.dbms.save($.done());
			} else
				$.invalid('error-user');
		});
	});

	schema.addWorkflow('developer', function($) {

		if (FUNC.unauthorized($))
			return;

		$.DB().read('tbl_user').fields('isdeveloper').where('id', $.id).query('isremoved=FALSE').orm('id').callback(function(err, response) {
			if (response) {
				response.isdeveloper = !response.isdeveloper;
				response.dbms.save($.done());
			} else
				$.invalid('error-user');
		});
	});

	schema.addWorkflow('sa', function($) {

		if (FUNC.unauthorized($))
			return;

		$.DB().read('tbl_user').fields('sa').where('id', $.id).query('isremoved=FALSE').orm('id').callback(function(err, response) {
			if (response) {
				response.sa = !response.sa;
				response.dbms.save($.done());
			} else
				$.invalid('error-user');
		});

	});
});