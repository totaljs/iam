NEWSCHEMA('Admin/Apps', function(schema) {

	schema.define('name', 'String(50)', true);
	schema.define('icon', 'String(50)');
	schema.define('description', 'String(100)', true);
	schema.define('author', 'String(50)', true);
	schema.define('email', 'Email', true);
	schema.define('phone', 'String(30)');
	schema.define('url', 'Url', true);
	schema.define('urlprivacy', 'Url', true);
	schema.define('urlterms', 'Url', true);
	schema.define('urlcallback', 'Url', true);
	schema.define('urlremove', 'Url', true);
	schema.define('urlupdate', 'Url');
	schema.define('urllogout', 'Url', true);
	schema.define('fields', 'String(300)', true);
	schema.define('isconfirmed', Boolean);
	schema.define('isdisabled', Boolean);

	schema.setQuery(function($) {
		if (!FUNC.unauthorized($))
			$.DB().listing('tbl_app').where('isremoved', false).callback($.callback).sort('dtcreated', true);
	});

	schema.setUpdate(function($) {

		if (FUNC.unauthorized($))
			return;

		var db = $.DB();
		var model = $.clean();
		model.dtupdated = NOW;
		model.search = (model.name + ' ' + model.description).toSearch().max(80);
		db.update('tbl_app', model).where('id', $.id).where('userid', $.user.id);
		db.callback($.done());
	});

	schema.setRemove(function($) {

		if (FUNC.unauthorized($))
			return;

		var db = $.DB();

		db.read('tbl_app').fields('urlremove,isremoved').orm('id').where('id', $.id).query('isremoved=FALSE').data(function(response) {

			response.isremoved = true;
			response.dtremoved = NOW;
			response.dbms.save();

			var builder = new RESTBuilder();
			builder.url(response.urlremove);
			builder.get();
			builder.exec(NOOP);
		});

		db.must('error-app');
		db.callback($.done());
	});

	schema.setGet(function($) {
		if (!FUNC.unauthorized($))
			$.DB().read('tbl_app').where('id', $.id).where('isremoved', false).callback($.callback);
	});

	schema.addWorkflow('disable', function($) {

		if (FUNC.unauthorized($))
			return;

		$.DB().read('tbl_app').fields('isdisabled').where('id', $.id).query('isremoved=FALSE').orm('id').callback(function(err, response) {
			if (response) {
				response.isdisabled = !response.isdisabled;
				response.dbms.save($.done());
			} else
				$.invalid('error-app');
		});
	});

	schema.addWorkflow('confirm', function($) {

		if (FUNC.unauthorized($))
			return;

		$.DB().read('tbl_app').fields('isconfirmed').where('id', $.id).query('isremoved=FALSE').orm('id').callback(function(err, response) {
			if (response) {
				response.isconfirmed = !response.isconfirmed;
				response.dbms.save($.done());
			} else
				$.invalid('error-app');
		});
	});

	schema.addWorkflow('active', function($) {

		if (FUNC.unauthorized($))
			return;

		$.DB().read('tbl_app').fields('isinactive').where('id', $.id).query('isremoved=FALSE').orm('id').callback(function(err, response) {
			if (response) {
				response.isinactive = !response.isinactive;
				response.dbms.save($.done());
			} else
				$.invalid('error-app');
		});
	});

});