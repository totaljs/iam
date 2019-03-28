var MAIN = global.MAIN = {};

// A storage for online sessions
// Used in /definitions/auth.js
MAIN.session = SESSION();

MAIN.session.ondata = function(meta, next) {
	DBMS().read('view_user').make(function(builder) {
		builder.fields('id,email,isdeveloper,sa,countprofiles,iscancel,dateformat,timeformat');
		builder.query('isdisabled=FALSE AND isinactive=FALSE AND isconfirmed=TRUE');
		builder.where('id', meta.id);
	}).callback(next);
};

// A simple ErrorBuilder transformation
ErrorBuilder.addTransform('simple', function(isResponse) {
	var obj = {};
	this.status = obj.status = 400;
	obj.error = this.items[0].error;
    return isResponse ? JSON.stringify(obj) : obj;
});