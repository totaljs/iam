NEWSCHEMA('Apps', function(schema) {

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
	schema.define('isdisabled', Boolean);

	schema.setQuery(function($) {
		if (!FUNC.notdeveloper($))
			$.DB().listing('tbl_app').query('isremoved=FALSE').where('userid', $.user.id).callback($.callback).sort('dtcreated', true);
	});

	schema.setInsert(function($) {

		if (FUNC.notdeveloper($))
			return;

		var model = $.clean();
		model.id = UID();
		model.dtcreated = NOW;
		model.client_id = U.GUID(20);
		model.client_secret = U.GUID(35);
		model.userid = $.user.id;
		model.isconfirmed = PREF.defconfirmedapp == null || PREF.defconfirmedapp === true;

		$.DB().insert('tbl_app', model).callback($.done());
	});

	schema.setUpdate(function($) {

		if (FUNC.notdeveloper($))
			return;

		var db = $.DB();
		var model = $.clean();
		model.dtupdated = NOW;
		model.search = (model.name + ' ' + model.description).toSearch().max(80);
		db.update('tbl_app', model).where('id', $.id).where('userid', $.user.id);
		db.callback($.done());
	});

	schema.setRemove(function($) {
		if (!FUNC.notdeveloper($))
			$.DB().update('tbl_app', { isremoved: true, dtremoved: NOW }).where('id', $.id).where('userid', $.user.id).callback($.done());
	});

	schema.setGet(function($) {
		if (!FUNC.notdeveloper($))
			$.DB().read('tbl_app').where('userid', $.user.id).where('id', $.id).query('isremoved=FALSE').callback($.callback);
	});

});