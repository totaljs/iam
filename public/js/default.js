ON('resize', function() {
	var el = $('#body');
	el.css('height', WH - el.offset().top);
	if (WIDTH() === 'xs') {
		var mm = $('.mainmenu,.mainmenu .scroller-xs');
		mm.css('height', WH - 70);
	}
});

ON('ready', function() {
	$(window).on('resize', function() {
		setTimeout2('resize', function() {
			EMIT('resize');
		}, 100);
	});
	setTimeout(EXEC2('#resize'), 50);
});

function mainmenu(el) {
	$('.mainmenu').tclass('mainmenu-visible');
}

ON('location', function() {
	$('.mainmenu').rclass('mainmenu-visible');
});

Thelpers.cl = function(id, name) {
	return (common.cl[name] || EMPTYARRAY).findValue('id', id, 'name', '---');
};

Thelpers.checkbox = function(val, reverse) {
	if (reverse)
		val = !val;
	return '<i class="fa-{0}"></i>'.format(val ? 'check-square green fa' : 'square far');
};

Thelpers.multiline = function(val) {
	return Thelpers.encode(val).replace(/\n/g, '<br>');
};

Thelpers.join = function(val, delimiter) {
	return val instanceof Array ? val.join(delimiter) : '';
};