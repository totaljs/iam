require('dbms').init(CONF.database, null, function(err, sql) {
	console.log('ERROR', err.toString(), '--->', sql);
});

ON('ready', function() {
	DBMS().modify('tbl_user', { isonline: false }).where('isonline', true);
});