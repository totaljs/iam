NEWSCHEMA('Admin/Settings', function(schema) {

	schema.define('defconfirmedapp', Boolean);
	schema.define('defdeveloper', Boolean);

	// Reads profile
	schema.setRead(function($) {
		$.callback(PREF);
	});

	// Saves settings
	schema.setSave(function($) {
		var model = $.model;
		PREF.set('defdeveloper', model.defdeveloper);
		PREF.set('defconfirmedapp', model.defconfirmedapp);
		$.success();
	});

});