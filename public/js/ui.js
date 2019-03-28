COMPONENT('input', 'maxlength:200;dirkey:name;dirvalue:id;increment:1;autovalue:name;after:\\:', function(self, config) {

	var cls = 'ui-input';
	var cls2 = '.' + cls;
	var input, placeholder, dirsource, binded, customvalidator, mask;

	self.init = function() {
		Thelpers.ui_input_icon = function(val) {
			return val.charAt(0) === '!' ? ('<span class="ui-input-icon-custom">' + val.substring(1) + '</span>') : ('<i class="fa fa-' + val + '"></i>');
		};
		W.ui_input_template = Tangular.compile(('{{ if label }}<div class="{0}-label">{{ if icon }}<i class="fa fa-{{ icon }}"></i>{{ fi }}{{ label | raw }}{{ after }}</div>{{ fi }}<div class="{0}-control{{ if licon }} {0}-licon{{ fi }}{{ if ricon || (type === \'number\' && increment) }} {0}-ricon{{ fi }}">{{ if ricon || (type === \'number\' && increment) }}<div class="{0}-icon-right{{ if type === \'number\' && increment }} {0}-increment{{ else if riconclick || type === \'date\' || type === \'time\' || type === \'search\' || type === \'password\' }} {0}-click{{ fi }}">{{ if type === \'number\' }}<i class="fa fa-caret-up"></i><i class="fa fa-caret-down"></i>{{ else }}{{ ricon | ui_input_icon }}{{ fi }}</div>{{ fi }}{{ if licon }}<div class="{0}-icon-left{{ if liconclick }} {0}-click{{ fi }}">{{ licon | ui_input_icon }}</div>{{ fi }}<div class="{0}-input{{ if align === 1 || align === \'center\' }} center{{ else if align === 2 || align === \'right\' }} right{{ fi }}">{{ if placeholder && !innerlabel }}<div class="{0}-placeholder">{{ placeholder }}</div>{{ fi }}<input type="{{ if !dirsource && type === \'password\' }}password{{ else }}text{{ fi }}"{{ if autofill }} name="{{ PATH }}"{{ else }} autocomplete="' + Date.now() + '"{{ fi }}{{ if dirsource }} readonly{{ else }} data-jc-bind=""{{ fi }}{{ if maxlength > 0}} maxlength="{{ maxlength }}"{{ fi }}{{ if autofocus }} autofocus{{ fi }} /></div></div>{{ if error }}<div class="{0}-error hidden"><i class="fa fa-warning"></i> {{ error }}</div>{{ fi }}').format(cls));
	};

	self.make = function() {

		if (!config.label)
			config.label = self.html();

		if (isMOBILE && config.autofocus)
			config.autofocus = false;

		config.PATH = self.path.replace(/\./g, '_');

		self.aclass(cls + ' invisible');
		self.rclass('invisible', 100);
		self.redraw();

		self.event('input change', function() {
			self.check();
		});

		self.event('focus', 'input', function() {
			self.aclass(cls + '-focused');
			config.autocomplete && EXEC(config.autocomplete, self, input.parent());
			if (config.autosource) {
				var opt = {};
				opt.element = self.element;
				opt.search = GET(config.autosource);
				opt.callback = function(value) {
					self.set(typeof(value) === 'string' ? value : value[config.autovalue], 2);
					self.change();
					self.bindvalue();
				};
				SETTER('autocomplete', 'show', opt);
			}
		});

		self.event('paste', 'input', function(e) {
			if (config.mask) {
				var val = (e.originalEvent.clipboardData || window.clipboardData).getData('text');
				self.set(val.replace(/\s|\t/g, ''));
				e.preventDefault();
			}
		});

		self.event('keydown', 'input', function(e) {

			var t = this;
			var code = e.which;

			if (t.readOnly || config.disabled) {
				e.preventDefault();
				e.stopPropagation();
				//self.curpos(0);
				return;
			}

			if (!config.disabled && config.dirsource && (code === 13 || code > 30)) {
				self.element.find(cls2 + '-control').trigger('click');
				return;
			}

			if (config.mask) {

				if (e.metaKey) {
					if (code === 8 || code === 127) {
						e.preventDefault();
						e.stopPropagation();
					}
					return;
				}

				if (code === 32) {
					e.preventDefault();
					e.stopPropagation();
					return;
				}

				var beg = e.target.selectionStart;
				var end = e.target.selectionEnd;
				var val = t.value;
				var c;

				if (code === 8 || code === 127) {

					if (beg === end) {
						c = config.mask.substring(beg - 1, beg);
						t.value = val.substring(0, beg - 1) + c + val.substring(beg);
						self.curpos(beg - 1);
					} else {
						for (var i = beg; i <= end; i++) {
							c = config.mask.substring(i - 1, i);
							val = val.substring(0, i - 1) + c + val.substring(i);
						}
						t.value = val;
						self.curpos(beg);
					}

					e.preventDefault();
					return;
				}

				if (code > 40) {

					var cur = String.fromCharCode(code);

					if (mask && mask[beg]) {
						if (!mask[beg].test(cur)) {
							e.preventDefault();
							return;
						}
					}

					c = config.mask.charCodeAt(beg);
					if (c !== 95) {
						beg++;
						while (true) {
							c = config.mask.charCodeAt(beg);
							if (c === 95 || isNaN(c))
								break;
							else
								beg++;
						}
					}

					if (c === 95) {

						val = val.substring(0, beg) + cur + val.substring(beg + 1);
						t.value = val;
						beg++;

						while (beg < config.mask.length) {
							c = config.mask.charCodeAt(beg);
							if (c === 95)
								break;
							else
								beg++;
						}

						self.curpos(beg);
					} else
						self.curpos(beg + 1);

					e.preventDefault();
					e.stopPropagation();
				}
			}
		});

		self.event('blur', 'input', function() {
			self.rclass(cls + '-focused');
		});

		self.event('click', cls2 + '-control', function() {

			if (!config.dirsource || config.disabled)
				return;

			var opt = {};
			opt.element = self.find(cls2 + '-control');
			opt.items = dirsource;
			opt.offsetY = -1;
			opt.placeholder = config.dirplaceholder;
			opt.render = config.dirrender ? GET(config.dirrender) : null;
			opt.custom = !!config.dircustom;
			opt.offsetWidth = 2;
			opt.minwidth = config.dirminwidth || 200;
			opt.maxwidth = config.dirmaxwidth;
			opt.key = config.dirkey || config.key;
			opt.empty = config.dirempty;

			if (config.dirsearch === false)
				opt.search = false;

			var val = self.get();
			opt.selected = val;

			if (config.direxclude === false) {
				for (var i = 0; i < dirsource.length; i++) {
					var item = dirsource[i];
					if (item)
						item.selected = typeof(item) === 'object' && item[config.dirvalue] === val;
				}
			} else {
				opt.exclude = function(item) {
					return item ? item[config.dirvalue] === val : false;
				};
			}

			opt.callback = function(item, el, custom) {

				// empty
				if (item == null) {
					input.val('');
					self.set(null, 2);
					self.change();
					self.check();
					return;
				}

				var val = custom || typeof(item) === 'string' ? item : item[config.dirvalue || config.value];
				if (custom && typeof(config.dircustom) === 'string') {
					var fn = GET(config.dircustom);
					fn(val, function(val) {
						self.set(val, 2);
						self.change();
						self.bindvalue();
					});
				} else if (!custom) {
					self.set(val, 2);
					self.change();
					self.bindvalue();
				}
			};

			SETTER('directory', 'show', opt);
		});

		self.event('click', cls2 + '-placeholder,' + cls2 + '-label', function(e) {
			if (!config.disabled) {
				if (config.dirsource) {
					e.preventDefault();
					e.stopPropagation();
					self.element.find(cls2 + '-control').trigger('click');
				} else
					input.focus();
			}
		});

		self.event('click', cls2 + '-icon-left,' + cls2 + '-icon-right', function(e) {

			if (config.disabled)
				return;

			var el = $(this);
			var left = el.hclass(cls + '-icon-left');
			var opt;

			if (config.dirsource && left && config.liconclick) {
				e.preventDefault();
				e.stopPropagation();
			}

			if (!left && !config.riconclick) {
				if (config.type === 'date') {
					opt = {};
					opt.element = self.element;
					opt.value = self.get();
					opt.callback = function(date) {
						self.change(true);
						self.set(date);
					};
					SETTER('datepicker', 'show', opt);
				} else if (config.type === 'time') {
					opt = {};
					opt.element = self.element;
					opt.value = self.get();
					opt.callback = function(date) {
						self.change(true);
						self.set(date);
					};
					SETTER('timepicker', 'show', opt);
				} else if (config.type === 'search')
					self.set('');
				else if (config.type === 'password')
					self.password();
				else if (config.type === 'number') {
					var n = $(e.target).hclass('fa-caret-up') ? 1 : -1;
					self.change(true);
					self.inc(config.increment * n);
				}
				return;
			}

			if (left && config.liconclick)
				EXEC(config.liconclick, self, el);
			else if (config.riconclick)
				EXEC(config.riconclick, self, el);
		});
	};

	self.curpos = function(pos) {
		var el = input[0];
		if (el.createTextRange) {
			var range = el.createTextRange();
			range.move('character', pos);
			range.select();
		} else if (el.selectionStart) {
			el.focus();
			el.setSelectionRange(pos, pos);
		}
	};

	self.validate = function(value) {

		if (!config.required || config.disabled)
			return true;

		if (config.dirsource)
			return !!value;

		if (customvalidator)
			return customvalidator(value);

		if (self.type === 'date')
			return value instanceof Date && !isNaN(value.getTime());

		if (value == null)
			value = '';
		else
			value = value.toString();

		if (config.mask && typeof(value) === 'string' && value.indexOf('_') !== -1)
			return false;

		if (config.minlength && value.length < config.minlength)
			return false;

		switch (self.type) {
			case 'email':
				return value.isEmail();
			case 'phone':
				return value.isPhone();
			case 'url':
				return value.isURL();
			case 'currency':
			case 'number':

				value = value.parseFloat();

				if (config.minvalue != null && value < config.minvalue)
					return false;

				if (config.maxvalue != null && value > config.maxvalue)
					return false;

				return value > 0;
		}

		return value.length > 0;
	};

	self.offset = function() {
		var offset = self.element.offset();
		var control = self.find(cls2 + '-control');
		var width = control.width() + 2;
		return { left: offset.left, top: control.offset().top + control.height(), width: width };
	};

	self.password = function(show) {
		var visible = show == null ? input.attr('type') === 'text' : show;
		input.attr('type', visible ? 'password' : 'text');
		self.find(cls2 + '-icon-right').find('i').tclass(config.ricon, visible).tclass('fa-eye-slash', !visible);
	};

	self.getterin = self.getter;
	self.getter = function(value, realtime, nobind) {
		if (config.mask && config.masktidy) {
			var val = [];
			for (var i = 0; i < value.length; i++) {
				if (config.mask.charAt(i) === '_')
					val.push(value.charAt(i));
			}
			value = val.join('');
		}
		self.getterin(value, realtime, nobind);
	};

	self.setterin = self.setter;

	self.setter = function(value, path, type) {

		if (config.mask) {
			if (value) {
				if (config.masktidy) {
					var index = 0;
					var val = [];
					for (var i = 0; i < config.mask.length; i++) {
						var c = config.mask.charAt(i);
						if (c === '_')
							val.push(value.charAt(index++) || '_');
						else
							val.push(c);
					}
					value = val.join('');
				}

				// check values
				if (mask) {
					var arr = [];
					for (var i = 0; i < mask.length; i++) {
						var c = value.charAt(i);
						if (mask[i] && mask[i].test(c))
							arr.push(c);
						else
							arr.push(config.mask.charAt(i));
					}
					value = arr.join('');
				}
			} else
				value = config.mask;
		}

		self.setterin(value, path, type);
		self.bindvalue();

		if (config.type === 'password')
			self.password(true);
	};

	self.check = function() {

		var is = !!input[0].value;

		if (binded === is)
			return;

		binded = is;
		placeholder && placeholder.tclass('hidden', is);
		self.tclass(cls + '-binded', is);

		if (config.type === 'search')
			self.find(cls2 + '-icon-right').find('i').tclass(config.ricon, !is).tclass('fa-times', is);
	};

	self.bindvalue = function() {
		if (dirsource) {

			var value = self.get();
			var item;

			for (var i = 0; i < dirsource.length; i++) {
				item = dirsource[i];
				if (typeof(item) === 'string') {
					if (item === value)
						break;
					item = null;
				} else if (item[config.dirvalue || config.value] === value) {
					item = item[config.dirkey || config.key];
					break;
				} else
					item = null;
			}

			if (value && item == null && config.dircustom)
				item = value;

			input.val(item || '');
		}
		self.check();
	};

	self.redraw = function() {

		if (!config.ricon) {
			if (config.dirsource)
				config.ricon = 'angle-down';
			else if (config.type === 'date') {
				config.ricon = 'calendar';
				if (!config.align && !config.innerlabel)
					config.align = 1;
			} else if (config.type === 'time') {
				config.ricon = 'clock-o';
				if (!config.align && !config.innerlabel)
					config.align = 1;
			} else if (config.type === 'search')
				config.ricon = 'search';
			else if (config.type === 'password')
				config.ricon = 'eye';
			else if (config.type === 'number') {
				if (!config.align && !config.innerlabel)
					config.align = 1;
			}
		}

		self.tclass(cls + '-masked', !!config.mask);
		self.html(W.ui_input_template(config));
		input = self.find('input');
		placeholder = self.find(cls2 + '-placeholder');
	};

	self.configure = function(key, value) {
		switch (key) {
			case 'dirsource':
				self.datasource(value, function(path, value) {
					dirsource = value;
					self.bindvalue();
				});
				self.tclass(cls + '-dropdown', !!value);
				break;
			case 'disabled':
				self.tclass('ui-disabled', value == true);
				input.prop('readonly', value === true);
				self.reset();
				break;
			case 'required':
				self.tclass(cls + '-required', value == true);
				self.reset();
				break;
			case 'type':
				self.type = value;
				break;
			case 'validate':
				customvalidator = value ? (/\(|=|>|<|\+|-|\)/).test(value) ? FN('value=>' + value) : (function(path) { return function(value) { return GET(path)(value); }; })(value) : null;
				break;
			case 'innerlabel':
				self.tclass(cls + '-inner', value);
				break;
			case 'maskregexp':
				if (value) {
					mask = value.toLowerCase().split(',');
					for (var i = 0; i < mask.length; i++) {
						var m = mask[i];
						if (!m || m === 'null')
							mask[i] = '';
						else
							mask[i] = new RegExp(m);
					}
				} else
					mask = null;
				break;
			case 'mask':
				config.mask = value.replace(/#/g, '_');
				break;
		}
	};

	self.formatter(function(path, value) {
		if (value) {
			switch (config.type) {
				case 'lower':
					return value.toString().toLowerCase();
				case 'upper':
					return value.toString().toUpperCase();
				case 'date':
					return value.format(config.format || 'yyyy-MM-dd');
				case 'time':
					return value.format(config.format || 'HH:mm');
				case 'number':
					return config.format ? value.format(config.format) : value;
			}
		}

		return value;
	});

	self.parser(function(path, value) {
		if (value) {
			var tmp;
			switch (config.type) {
				case 'date':
					tmp = self.get();
					if (tmp)
						tmp = tmp.format('HH:mm');
					else
						tmp = '';
					return value + (tmp ? (' ' + tmp) : '');
				case 'lower':
					value = value.toLowerCase();
					break;
				case 'upper':
					value = value.toUpperCase();
					break;
				case 'time':
					tmp = value.split(':');
					var dt = self.get();
					if (dt == null)
						dt = new Date();
					dt.setHours(+(tmp[0] || '0'));
					dt.setMinutes(+(tmp[1] || '0'));
					dt.setSeconds(+(tmp[2] || '0'));
					value = dt;
					break;
			}
		}
		return value ? config.spaces === false ? value.replace(/\s/g, '') : value : value;
	});

	self.state = function(type) {
		if (!type)
			return;
		var invalid = config.required ? self.isInvalid() : false;
		if (invalid === self.$oldstate)
			return;
		self.$oldstate = invalid;
		self.tclass(cls + '-invalid', invalid);
		config.error && self.find(cls2 + '-error').tclass('hidden', !invalid);
	};
});

COMPONENT('part', 'hide:true', function(self, config) {

	var init = false;
	var clid = null;
	var downloading = false;

	self.readonly();
	self.setter = function(value) {

		if (config.if !== value) {

			if (!self.hclass('hidden')) {
				config.hidden && EXEC(config.hidden);
				config.hide && self.aclass('hidden');
				self.release(true);
			}

			if (config.cleaner && init && !clid)
				clid = setTimeout(self.clean, config.cleaner * 60000);

			return;
		}

		config.hide && self.rclass('hidden');

		if (self.element[0].hasChildNodes()) {

			if (clid) {
				clearTimeout(clid);
				clid = null;
			}

			self.release(false);
			config.reload && EXEC(config.reload);
			config.default && DEFAULT(config.default, true);

			setTimeout(function() {
				self.element.SETTER('*', 'resize');
			}, 200);

		} else {

			if (downloading)
				return;

			SETTER('loading', 'show');
			downloading = true;
			setTimeout(function() {
				self.import(config.url, function() {
					downloading = false;

					if (!init) {
						config.init && EXEC(config.init);
						init = true;
					}

					self.release(false);
					config.reload && EXEC(config.reload);
					config.default && DEFAULT(config.default, true);
					SETTER('loading', 'hide', 1000);

					setTimeout(function() {
						self.element.SETTER('*', 'resize');
					}, 200);
				});
			}, 200);
		}
	};

	self.configure = function(key, value) {
		switch (key) {
			case 'if':
				config.if = value + '';
				break;
		}
	};

	self.clean = function() {
		if (self.hclass('hidden')) {
			config.clean && EXEC(config.clean);
			setTimeout(function() {
				self.empty();
				init = false;
				clid = null;
				setTimeout(FREE, 1000);
			}, 1000);
		}
	};
});

COMPONENT('loading', function(self) {

	var pointer;

	self.readonly();
	self.singleton();
	self.nocompile && self.nocompile();

	self.make = function() {
		self.aclass('ui-loading');
		self.append('<div><div class="ui-loading-text"></div></div>');
	};

	self.show = function(text) {
		clearTimeout(pointer);
		self.find('.ui-loading-text').html(text || '');
		self.rclass('hidden');
		return self;
	};

	self.hide = function(timeout) {
		clearTimeout(pointer);
		pointer = setTimeout(function() {
			self.aclass('hidden');
		}, timeout || 1);
		return self;
	};
});

COMPONENT('selected', 'class:selected;selector:a', function(self, config) {
	self.bindvisible();
	self.readonly();
	self.setter = function(value) {
		var cls = config.class;
		self.find(config.selector).each(function() {
			var el = $(this);
			if (el.attrd('if') === value)
				el.aclass(cls);
			else
				el.hclass(cls) && el.rclass(cls);
		});
	};
});

COMPONENT('importer', function(self, config) {

	var init = false;
	var clid = null;
	var content = '';

	self.readonly();

	self.make = function() {
		var scr = self.find('script');
		content = scr.length ? scr.html() : '';
	};

	self.reload = function(recompile) {
		config.reload && EXEC(config.reload);
		recompile && COMPILE();
	};

	self.setter = function(value) {

		if (config.if !== value) {
			if (config.cleaner && init && !clid)
				clid = setTimeout(self.clean, config.cleaner * 60000);
			return;
		}

		if (clid) {
			clearTimeout(clid);
			clid = null;
		}

		if (init) {
			self.reload();
			return;
		}

		init = true;

		if (content) {
			self.html(content);
			setTimeout(self.reload, 50, true);
		} else
			self.import(config.url, self.reload);
	};

	self.clean = function() {
		config.clean && EXEC(config.clean);
		setTimeout(function() {
			self.empty();
			init = false;
			clid = null;
		}, 1000);
	};
});

COMPONENT('modal', 'zindex:12;width:800;bg:true', function(self, config) {

	var cls = 'ui-modal';
	var cls2 = '.' + cls;
	var W = window;
	var eheader, earea, ebody, efooter, emodal, icon, first = true;

	if (W.$$modal == null) {
		W.$$modal = 0;

		var resizemodal = function() {
			SETTER('modal', 'resize');
		};
		var resize = function() {
			setTimeout2(cls, resizemodal, 300);
		};
		if (W.OP)
			W.OP.on('resize', resize);
		else
			$(W).on('resize', resize);
	}

	self.readonly();

	self.make = function() {

		$(document.body).append('<div id="{0}" class="{1}-container hidden"></div>'.format(self.ID, cls));

		var scr = self.find('> script');
		self.template = scr.length ? scr.html() : '';
		self.aclass(cls);

		var el = $('#' + self.ID);
		el[0].appendChild(self.dom);

		self.rclass('hidden');
		self.replace(el);

		self.event('click', '.cancel', self.cancel);
		self.event('click', 'button[name]', function() {
			var t = this;
			if (!t.disabled) {
				switch (t.name) {
					case 'submit':
					case 'cancel':
						self[t.name]();
						break;
				}
			}
		});


		if (!self.template)
			self.prepare();

		config.enter && self.event('keydown', 'input', function(e) {
			e.which === 13 && !self.find('button[name="submit"]')[0].disabled && setTimeout(self.submit, 800);
		});
	};

	self.submit = function() {
		if (config.submit)
			EXEC(config.submit, self.hide);
		else
			self.hide();
	};

	self.cancel = function() {
		if (config.cancel)
			EXEC(config.cancel, self.hide);
		else
			self.hide();
	};

	self.hide = function() {
		self.set('');
	};

	self.resize = function() {

		if (self.hclass('hidden'))
			return;

		var mobile = WIDTH() === 'xs';

		var hh = eheader.height();
		var hb = ebody.height();
		var hf = efooter.height();
		var h = Math.ceil((WH / 100) * (mobile ? 94 : 90));
		var hs = hh + hb + hf;

		var top = ((WH - h) / 2.2) >> 0;
		var width = mobile ? emodal.width() : config.width;
		var ml = Math.ceil(width / 2) * -1;

		if (config.center) {
			top = Math.ceil((WH / 2) - (hs / 2));
			if (top < 0)
				top = (WH - h) / 2 >> 0;
		}

		if (!mobile && config.align) {
			top = '';
			ml = '';
			hh += 25;
		}

		var sw = SCROLLBARWIDTH();
		ebody.css({ 'margin-right': sw ? sw : null });
		emodal.css({ top: top, 'margin-left': ml });
		earea.css({ 'max-height': h - hh - hf, 'width': width + 30 });
	};

	self.configure = function(key, value, init, prev) {
		switch (key) {
			case 'bg':
				self.tclass(cls + '-bg', !!value);
				break;
			case 'title':
				eheader && eheader.find('label').html(value);
				break;
			case 'width':
				emodal && emodal.css('max-width', config.width);
				self.resize();
				break;
			case 'center':
				self.resize();
				break;
			case 'align':
				prev && emodal.rclass(cls + '-align-' + prev);
				value && emodal.aclass(cls + '-align-' + value);
				self.resize();
				break;
			case 'icon':
				if (eheader) {
					if (icon) {
						prev && icon.rclass('fa-' + prev);
					} else {
						eheader.prepend('<i class="{0}-icon fa"></i>'.format(cls));
						icon = eheader.find(cls2 + '-icon');
					}
					value && icon.aclass('fa-' + value);
				}
				break;
		}
	};

	self.prepare = function(dynamic) {

		self.find(cls2 + ' > div').each(function(index) {
			$(this).aclass(cls + '-' + (index === 0 ? 'header' : index === 1 ? 'body' : 'footer'));
		});

		eheader = self.find(cls2 + '-header');
		ebody = self.find(cls2 + '-body');
		efooter = self.find(cls2 + '-footer');
		emodal = self.find(cls2);
		ebody.wrap('<div class="{0}-body-area" />'.format(cls));
		earea = self.find(cls2 + '-body-area');
		config.label && eheader.find('label').html(config.label);
		dynamic && self.reconfigure(config);

		earea.on('scroll', function() {
			if (!self.$scrolling) {
				EMIT('scrolling', self.name);
				EMIT('reflow', self.name);
				self.$scrolling = true;
				setTimeout(function() {
					self.$scrolling = false;
				}, 1500);
			}
		});
	};

	self.setter = function(value) {

		setTimeout2(cls + '-noscroll', function() {
			$('html').tclass(cls + '-noscroll', !!$(cls2 + '-bg').not('.hidden').length);
		}, 789);

		var hidden = value !== config.if;

		if (self.hclass('hidden') === hidden)
			return;

		setTimeout2(cls + 'reflow', function() {
			EMIT('reflow', self.name);
		}, 10);

		if (hidden) {
			self.rclass(cls + '-visible');
			setTimeout(function() {
				self.aclass('hidden');
				self.release(true);
			}, 100);
			W.$$modal--;
			return;
		}

		if (self.template) {
			var is = self.template.COMPILABLE();
			self.find('div[data-jc-replaced]').html(self.template);
			self.prepare(true);
			self.template = null;
			is && COMPILE();
		}

		if (W.$$modal < 1)
			W.$$modal = 1;

		W.$$modal++;

		self.css('z-index', W.$$modal * config.zindex);
		self.element.scrollTop(0);
		self.rclass('hidden');

		self.resize();
		self.release(false);

		config.reload && EXEC(config.reload, self);
		config.default && DEFAULT(config.default, true);

		if (!isMOBILE && config.autofocus) {
			var el = self.find(config.autofocus === true ? 'input[type="text"],input[type="password"],select,textarea' : config.autofocus);
			el.length && setTimeout(function() {
				el[0].focus();
			}, 1500);
		}

		var delay = first ? 500 : 0;

		setTimeout(function() {
			earea[0].scrollTop = 0;
			self.aclass(cls + '-visible');
		}, 300 + delay);

		// Fixes a problem with freezing of scrolling in Chrome
		setTimeout2(self.ID, function() {
			self.css('z-index', (W.$$modal * config.zindex) + 1);
		}, 500 + delay);

		first = false;
	};
});

COMPONENT('radiobutton', function(self, config) {

	self.nocompile && self.nocompile();

	self.configure = function(key, value, init) {
		if (init)
			return;
		switch (key) {
			case 'disabled':
				self.tclass('ui-disabled', value);
				break;
			case 'required':
				self.find('.ui-radiobutton-label').tclass('ui-radiobutton-label-required', value);
				break;
			case 'type':
				self.type = config.type;
				break;
			case 'label':
				self.find('.ui-radiobutton-label').html(value);
				break;
			case 'items':
				self.find('div').remove();
				var builder = [];
				value.split(',').forEach(function(item) {
					item = item.split('|');
					builder.push('<div data-value="{0}"><i></i><span>{1}</span></div>'.format(item[0] || item[1], item[1] || item[0]));
				});
				self.append(builder.join(''));
				self.refresh();
				break;
		}
	};

	self.make = function() {
		var builder = [];
		var label = config.label || self.html();
		label && builder.push('<div class="ui-radiobutton-label{1}">{0}</div>'.format(label, config.required ? ' ui-radiobutton-label-required' : ''));
		self.aclass('ui-radiobutton{0}'.format(config.inline === false ? ' ui-radiobutton-block' : ''));
		self.event('click', 'div', function() {
			if (config.disabled)
				return;
			var value = self.parser($(this).attrd('value'));
			self.set(value);
			self.change(true);
		});
		self.html(builder.join(''));
		config.items && self.reconfigure('items:' + config.items);
		config.type && (self.type = config.type);
	};

	self.validate = function(value) {
		return config.disabled || !config.required ? true : !!value;
	};

	self.setter = function(value) {
		self.find('div').each(function() {
			var el = $(this);
			var is = el.attrd('value') === (value == null ? null : value.toString());
			el.tclass('ui-radiobutton-selected', is);
			el.find('.fa').tclass('fa-circle-o', !is).tclass('fa-circle', is);
		});
	};
});

COMPONENT('preview', 'width:200;height:100;background:#FFFFFF;quality:90;schema:{file\\:base64,name\\:filename}', function(self, config) {

	var empty, img, canvas, name, content = null;

	self.readonly();
	self.nocompile && self.nocompile();

	self.configure = function(key, value, init) {

		if (init)
			return;

		var redraw = false;

		switch (key) {
			case 'width':
			case 'height':
			case 'background':
				setTimeout2(self.id + 'reinit', self.reinit, 50);
				break;
			case 'label':
			case 'icon':
				redraw = true;
				break;
		}

		redraw && setTimeout2(self.id + 'redraw', function() {
			self.redraw();
			self.refresh();
		}, 50);
	};

	self.reinit = function() {
		canvas = document.createElement('canvas');
		canvas.width = config.width;
		canvas.height = config.height;
		var ctx = canvas.getContext('2d');
		ctx.fillStyle = config.background;
		ctx.fillRect(0, 0, config.width, config.height);
		empty = canvas.toDataURL('image/png');
		canvas = null;
	};

	self.resize = function(image) {
		var canvas = document.createElement('canvas');
		var ctx = canvas.getContext('2d');
		canvas.width = config.width;
		canvas.height = config.height;
		ctx.fillStyle = config.background;
		ctx.fillRect(0, 0, config.width, config.height);

		var w = 0;
		var h = 0;
		var x = 0;
		var y = 0;

		if (image.width < config.width && image.height < config.height) {
			w = image.width;
			h = image.height;
			x = (config.width / 2) - (image.width / 2);
			y = (config.height / 2) - (image.height / 2);
		} else if (image.width >= image.height) {
			w = config.width;
			h = image.height * (config.width / image.width);
			y = (config.height / 2) - (h / 2);
		} else {
			h = config.height;
			w = (image.width * (config.height / image.height)) >> 0;
			x = (config.width / 2) - (w / 2);
		}

		ctx.drawImage(image, x, y, w, h);
		var base64 = canvas.toDataURL('image/jpeg', config.quality * 0.01);
		img.attr('src', base64);
		self.upload(base64);
	};

	self.redraw = function() {
		var label = config.label || content;
		self.html((label ? '<div class="ui-preview-label">{0}{1}:</div>'.format(config.icon ? '<i class="fa fa-{0}"></i>'.format(config.icon) : '', label) : '') + '<input type="file" accept="image/*" class="hidden" /><img src="{0}" class="img-responsive" alt="" />'.format(empty, config.width, config.height));
		img = self.find('img');
		img.on('click', function() {
			self.find('input').trigger('click');
		});
	};

	self.make = function() {

		content = self.html();
		self.aclass('ui-preview');
		self.reinit();
		self.redraw();

		self.event('change', 'input', function() {
			var file = this.files[0];
			file && self.load(file);
			this.value = '';
		});

		self.event('dragenter dragover dragexit drop dragleave', function (e) {

			e.stopPropagation();
			e.preventDefault();

			switch (e.type) {
				case 'drop':
					break;
				default:
					return;
			}

			var dt = e.originalEvent.dataTransfer;
			if (dt && dt.files.length) {
				var file = e.originalEvent.dataTransfer.files[0];
				file && self.load(file);
			}
		});
	};

	self.load = function(file) {
		name = file.name;
		self.getOrientation(file, function(orient) {
			var reader = new FileReader();
			reader.onload = function () {
				var img = new Image();
				img.onload = function() {
					self.resize(img);
					self.change(true);
				};
				img.crossOrigin = 'anonymous';
				if (orient < 2) {
					img.src = reader.result;
				} else {
					SETTER('loading', 'show');
					self.resetOrientation(reader.result, orient, function(url) {
						SETTER('loading', 'hide', 500);
						img.src = url;
					});
				}
			};
			reader.readAsDataURL(file);
		});
	};

	self.upload = function(base64) {
		if (base64) {
			var data = (new Function('base64', 'filename', 'return ' + config.schema))(base64, name);
			SETTER('loading', 'show');
			AJAX('POST ' + config.url.env(true), data, function(response, err) {
				SETTER('loading', 'hide', 100);
				if (err) {
					SETTER('snackbar', 'warning', err.toString());
				} else {
					self.change(true);
					self.set(response);
				}
			});
		}
	};

	self.setter = function(value) {
		img.attr('src', value ? value : empty);
	};

	// http://stackoverflow.com/a/32490603
	self.getOrientation = function(file, callback) {
		var reader = new FileReader();
		reader.onload = function(e) {
			var view = new DataView(e.target.result);
			if (view.getUint16(0, false) != 0xFFD8)
				return callback(-2);
			var length = view.byteLength;
			var offset = 2;
			while (offset < length) {
				var marker = view.getUint16(offset, false);
				offset += 2;
				if (marker == 0xFFE1) {
					if (view.getUint32(offset += 2, false) != 0x45786966)
						return callback(-1);
					var little = view.getUint16(offset += 6, false) == 0x4949;
					offset += view.getUint32(offset + 4, little);
					var tags = view.getUint16(offset, little);
					offset += 2;
					for (var i = 0; i < tags; i++)
						if (view.getUint16(offset + (i * 12), little) == 0x0112)
							return callback(view.getUint16(offset + (i * 12) + 8, little));
				} else if ((marker & 0xFF00) != 0xFF00)
					break;
				else
					offset += view.getUint16(offset, false);
			}
			return callback(-1);
		};
		reader.readAsArrayBuffer(file.slice(0, 64 * 1024));
	};

	self.resetOrientation = function(src, srcOrientation, callback) {
		var img = new Image();
		img.onload = function() {
			var width = img.width;
			var height = img.height;
			var canvas = document.createElement('canvas');
			var ctx = canvas.getContext('2d');

			// set proper canvas dimensions before transform & export
			if (4 < srcOrientation && srcOrientation < 9) {
				canvas.width = height;
				canvas.height = width;
			} else {
				canvas.width = width;
				canvas.height = height;
			}
			switch (srcOrientation) {
				case 2: ctx.transform(-1, 0, 0, 1, width, 0); break;
				case 3: ctx.transform(-1, 0, 0, -1, width, height); break;
				case 4: ctx.transform(1, 0, 0, -1, 0, height); break;
				case 5: ctx.transform(0, 1, 1, 0, 0, 0); break;
				case 6: ctx.transform(0, 1, -1, 0, height, 0); break;
				case 7: ctx.transform(0, -1, -1, 0, height, width); break;
				case 8: ctx.transform(0, -1, 1, 0, 0, width); break;
			}
			ctx.drawImage(img, 0, 0);
			callback(canvas.toDataURL());
		};
		img.src = src;
	};
});

COMPONENT('validation', 'delay:100;flags:visible', function(self, config) {

	var path, elements = null;
	var def = 'button[name="submit"]';
	var flags = null;

	self.readonly();

	self.make = function() {
		elements = self.find(config.selector || def);
		path = self.path.replace(/\.\*$/, '');
		setTimeout(function() {
			self.watch(self.path, self.state, true);
		}, 50);
	};

	self.configure = function(key, value, init) {
		switch (key) {
			case 'selector':
				if (!init)
					elements = self.find(value || def);
				break;
			case 'flags':
				if (value) {
					flags = value.split(',');
					for (var i = 0; i < flags.length; i++)
						flags[i] = '@' + flags[i];
				} else
					flags = null;
				break;
		}
	};

	self.state = function() {
		setTimeout2(self.id, function() {
			var disabled = DISABLED(path, flags);
			if (!disabled && config.if)
				disabled = !EVALUATE(self.path, config.if);
			elements.prop('disabled', disabled);
		}, config.delay);
	};
});

COMPONENT('datepicker', 'today:Set today;firstday:0;close:Close;yearselect:true;monthselect:true;yearfrom:-70 years;yearto:5 years', function(self, config) {

	var skip = false;
	var visible = false;
	var touchdiff;
	var startX;

	self.days = EMPTYARRAY;
	self.months = EMPTYARRAY;
	self.months_short = EMPTYARRAY;
	self.years_from;
	self.years_to;

	self.singleton();
	self.readonly();
	self.nocompile();

	self.configure = function(key, value) {
		switch (key) {
			case 'days':
				if (value instanceof Array)
					self.days = value;
				else
					self.days = value.split(',').trim();

				for (var i = 0; i < DAYS.length; i++) {
					DAYS[i] = self.days[i];
					self.days[i] = DAYS[i].substring(0, 2).toUpperCase();
				}

				break;

			case 'months':
				if (value instanceof Array)
					self.months = value;
				else
					self.months = value.split(',').trim();

				self.months_short = [];

				for (var i = 0, length = self.months.length; i < length; i++) {
					var m = self.months[i];
					MONTHS[i] = m;
					if (m.length > 4)
						m = m.substring(0, 3) + '.';
					self.months_short.push(m);
				}
				break;

			case 'yearfrom':
				if (value.indexOf('current') !== -1)
					self.years_from = +(new Date().format('yyyy'));
				else
					self.years_from = +(new Date().add(value).format('yyyy'));
				break;

			case 'yearto':
				if (value.indexOf('current') !== -1)
					self.years_to = +(new Date().format('yyyy'));
				else
					self.years_to = +(new Date().add(value).format('yyyy'));
				break;
		}
	};

	function getMonthDays(dt) {

		var m = dt.getMonth();
		var y = dt.getFullYear();

		if (m === -1) {
			m = 11;
			y--;
		}

		return (32 - new Date(y, m, 32).getDate());
	}

	self.calculate = function(year, month, selected) {

		var d = new Date(year, month, 1, 12, 0);
		var output = { header: [], days: [], month: month, year: year };
		var firstDay = config.firstday;
		var firstCount = 0;
		var frm = d.getDay() - firstDay;
		var today = new Date();
		var ty = today.getFullYear();
		var tm = today.getMonth();
		var td = today.getDate();
		var sy = selected ? selected.getFullYear() : -1;
		var sm = selected ? selected.getMonth() : -1;
		var sd = selected ? selected.getDate() : -1;
		var days = getMonthDays(d);

		if (frm < 0)
			frm = 7 + frm;

		while (firstCount++ < 7) {
			output.header.push({ index: firstDay, name: self.days[firstDay] });
			firstDay++;
			if (firstDay > 6)
				firstDay = 0;
		}

		var index = 0;
		var indexEmpty = 0;
		var count = 0;
		var prev = getMonthDays(new Date(year, month - 1, 1, 12, 0)) - frm;
		var cur;

		for (var i = 0; i < days + frm; i++) {

			var obj = { isToday: false, isSelected: false, isEmpty: false, isFuture: false, number: 0, index: ++count };

			if (i >= frm) {
				obj.number = ++index;
				obj.isSelected = sy === year && sm === month && sd === index;
				obj.isToday = ty === year && tm === month && td === index;
				obj.isFuture = ty < year;
				if (!obj.isFuture && year === ty) {
					if (tm < month)
						obj.isFuture = true;
					else if (tm === month)
						obj.isFuture = td < index;
				}

			} else {
				indexEmpty++;
				obj.number = prev + indexEmpty;
				obj.isEmpty = true;
				cur = d.add('-' + indexEmpty + ' days');
			}

			if (!obj.isEmpty)
				cur = d.add(i + ' days');

			obj.month = i >= frm && obj.number <= days ? d.getMonth() : cur.getMonth();
			obj.year = i >= frm && obj.number <= days ? d.getFullYear() : cur.getFullYear();
			obj.date = cur;
			output.days.push(obj);
		}

		indexEmpty = 0;

		for (var i = count; i < 42; i++) {
			var cur = d.add(i + ' days');
			var obj = { isToday: false, isSelected: false, isEmpty: true, isFuture: true, number: ++indexEmpty, index: ++count };
			obj.month = cur.getMonth();
			obj.year = cur.getFullYear();
			obj.date = cur;
			output.days.push(obj);
		}

		return output;
	};

	self.hide = function() {
		if (visible) {
			self.unbindevents();
			self.opt.close && self.opt.close();
			self.opt = null;
			self.older = null;
			self.target = null;
			self.aclass('hidden');
			self.rclass('ui-datepicker-visible');
			visible = false;
		}
		return self;
	};

	self.show = function(opt) {

		setTimeout(function() {
			clearTimeout2('datepickerhide');
		}, 5);

		var el = $(opt.element);
		var dom = el[0];

		if (self.target === dom) {
			self.hide();
			return;
		}

		if (self.opt && self.opt.close)
			self.opt.close();

		var off = el.offset();
		var h = el.innerHeight();
		var l = off.left + (opt.offsetX || 0);
		var t = off.top + h + 12 + (opt.offsetY || 0);
		var s = 250;

		if (l + s > WW) {
			var w = el.innerWidth();
			l = (l + w) - s;
		}

		var dt = typeof(opt.value) === 'string' ? GET(opt.value) : opt.value;
		if ((!(dt instanceof Date)) || isNaN(dt.getTime()))
			dt = NOW;

		self.opt = opt;
		self.time = dt.format('HH:mm:ss');
		self.css({ left: l, top: t });
		self.rclass('hidden');
		self.date(dt);
		self.aclass('ui-datepicker-visible', 50);
		self.bindevents();
		self.target = dom;
		visible = true;
		return self;
	};

	self.setdate = function(dt) {

		var time = self.time.split(':');

		if (time.length > 1) {
			dt.setHours(+(time[0] || '0'));
			dt.setMinutes(+(time[1] || '0'));
			dt.setSeconds(+(time[2] || '0'));
		}

		if (typeof(self.opt.value) === 'string')
			SET2(self.opt.value, dt);
		else
			self.opt.callback(dt);
	};

	self.make = function() {

		self.aclass('ui-datepicker hidden');

		var conf = {};

		if (!config.days) {
			conf.days = [];
			for (var i = 0; i < DAYS.length; i++)
				conf.days.push(DAYS[i].substring(0, 2).toUpperCase());
		}

		!config.months && (conf.months = MONTHS);
		self.reconfigure(conf);

		self.event('click', '.ui-datepicker-today-a', function() {
			self.setdate(new Date());
			self.hide();
		});

		self.event('click touchend', '.ui-datepicker-day', function() {
			if (Date.now() - touchdiff > 500)
				return;
			var arr = this.getAttribute('data-date').split('-');
			var dt = new Date(+arr[0], +arr[1], +arr[2], 12, 0);
			self.find('.ui-datepicker-selected').rclass('ui-datepicker-selected');
			var el = $(this).aclass('ui-datepicker-selected');
			skip = !el.hclass('ui-datepicker-disabled');
			self.setdate(dt);
			self.hide();
		});

		self.event('click', '.ui-datepicker-header', function(e) {
			e.stopPropagation();
		});

		self.event('change', '.ui-datepicker-year', function(e) {

			clearTimeout2('datepickerhide');
			e.preventDefault();
			e.stopPropagation();

			var arr = $(this).attrd('date').split('-');
			var dt = new Date(+arr[0], +arr[1], 1, 12, 0);
			dt.setFullYear(this.value);
			self.date(dt, true);
		});

		self.event('change', '.ui-datepicker-month', function(e){

			clearTimeout2('datepickerhide');
			e.preventDefault();
			e.stopPropagation();

			var arr = $(this).attrd('date').split('-');
			var dt = new Date(+arr[0], +arr[1], 1, 12, 0);
			dt.setMonth(this.value);
			self.date(dt, true);
		});

		self.event('click', 'button', function(e) {

			e.preventDefault();
			e.stopPropagation();

			var arr = $(this).attrd('date').split('-');
			var dt = new Date(+arr[0], +arr[1], 1, 12, 0);
			switch (this.name) {
				case 'prev':
					dt.setMonth(dt.getMonth() - 1);
					break;
				case 'next':
					dt.setMonth(dt.getMonth() + 1);
					break;
			}

			self.date(dt, true);
		});

		self.event('touchstart touchmove', '.ui-datepicker-table',function(e){

			e.stopPropagation();
			e.preventDefault();

			var x = e.originalEvent.touches[0].pageX;

			if (e.type === 'touchstart') {
				startX = x;
				touchdiff = Date.now();
				return;
			}

			var diffX = startX - x;
			if (diffX > 70 || diffX < -70) {
				var arr = $(this).data('date').split('-');
				var dt = new Date(+arr[0], +arr[1], 1, 12, 0);
				dt.setMonth(dt.getMonth() + (diffX > 50 ? 1 : -1));
				self.date(dt, true);
			}
		});


		window.$datepicker = self;

		var hide = function() {
			visible && window.$datepicker && window.$datepicker.hide();
		};

		var hide2 = function() {
			visible && setTimeout2('datepickerhide', function() {
				window.$datepicker && window.$datepicker.hide();
			}, 20);
		};

		self.bindevents = function() {
			if (!visible)
				$(window).on('scroll click', hide2);
		};

		self.unbindevents = function() {
			if (visible)
				$(window).off('scroll click', hide2);
		};

		self.on('reflow + scroll + resize', hide);
	};

	self.date = function(value, skipday) {

		var clssel = 'ui-datepicker-selected';

		if (typeof(value) === 'string')
			value = value.parseDate();

		var year = value == null ? null : value.getFullYear();
		if (year && (year < self.years_from || year > self.years_to))
			return;

		if (!value || isNaN(value.getTime())) {
			self.find('.' + clssel).rclass(clssel);
			value = NOW;
		}

		var empty = !value;

		if (skipday) {
			skipday = false;
			empty = true;
		}

		if (skip) {
			skip = false;
			return;
		}

		if (!value)
			value = NOW = new Date();

		var output = self.calculate(value.getFullYear(), value.getMonth(), value);
		var builder = [];

		for (var i = 0; i < 42; i++) {

			var item = output.days[i];

			if (i % 7 === 0) {
				builder.length && builder.push('</tr>');
				builder.push('<tr>');
			}

			var cls = [];

			item.isEmpty && cls.push('ui-datepicker-disabled');
			cls.push('ui-datepicker-day');

			!empty && item.isSelected && cls.push(clssel);
			item.isToday && cls.push('ui-datepicker-day-today');
			builder.push('<td class="{0}" data-date="{1}-{2}-{3}"><div>{3}</div></td>'.format(cls.join(' '), item.year, item.month, item.number));
		}

		builder.push('</tr>');

		var header = [];
		for (var i = 0; i < 7; i++)
			header.push('<th>{0}</th>'.format(output.header[i].name));

		var years = value.getFullYear();
		if (config.yearselect) {
			years = '';
			var current_year = value.getFullYear();
			for (var i = self.years_from; i <= self.years_to; i++)
				years += '<option value="{0}" {1}>{0}</option>'.format(i, i === current_year ? 'selected' : '');
			years = '<select data-date="{0}-{1}" class="ui-datepicker-year">{2}</select>'.format(output.year, output.month, years);
		}

		var months = self.months[value.getMonth()];
		if (config.monthselect) {
			months = '';
			var current_month = value.getMonth();
			for (var i = 0, l = self.months.length; i < l; i++)
				months += '<option value="{0}" {2}>{1}</option>'.format(i, self.months[i], i === current_month ? 'selected' : '');
			months = '<select data-date="{0}-{1}" class="ui-datepicker-month">{2}</select>'.format(output.year, output.month, months);
		}

		self.html('<div class="ui-datepicker-header"><button class="ui-datepicker-header-prev" name="prev" data-date="{0}-{1}"><span class="fa fa-arrow-left"></span></button><div class="ui-datepicker-header-info">{2} {3}</div><button class="ui-datepicker-header-next" name="next" data-date="{0}-{1}"><span class="fa fa-arrow-right"></span></button></div><div class="ui-datepicker-table" data-date="{0}-{1}"><table cellpadding="0" cellspacing="0" border="0"><thead>{4}</thead><tbody>{5}</tbody></table></div>'.format(output.year, output.month, months, years, header.join(''), builder.join('')) + (config.today ? '<div class="ui-datepicker-today"><span class="link">{0}</span><span class="link ui-datepicker-today-a"><i class="fa fa-datepicker"></i>{1}</span></div>'.format(config.close, config.today) : ''));
	};
});

COMPONENT('directory', 'minwidth:200', function(self, config) {

	var cls = 'ui-directory';
	var cls2 = '.' + cls;
	var container, timeout, icon, plus, skipreset = false, skipclear = false, ready = false, input = null;
	var is = false, selectedindex = 0, resultscount = 0;
	var template = '<li data-index="{{ $.index }}" data-search="{{ name }}" {{ if selected }} class="current selected{{ if classname }} {{ classname }}{{ fi }}"{{ else if classname }} class="{{ classname }}"{{ fi }}>{{ name | encode | ui_directory_helper }}</li>';

	Thelpers.ui_directory_helper = function(val) {
		var t = this;
		return t.template ? (typeof(t.template) === 'string' ? t.template.indexOf('{{') === -1 ? t.template : Tangular.render(t.template, this) : t.render(this, val)) : self.opt.render ? self.opt.render(this, val) : val;
	};

	self.template = Tangular.compile(template);
	self.readonly();
	self.singleton();
	self.nocompile && self.nocompile();

	self.configure = function(key, value, init) {
		if (init)
			return;
		switch (key) {
			case 'placeholder':
				self.find('input').prop('placeholder', value);
				break;
		}
	};

	self.make = function() {

		self.aclass(cls + ' hidden');
		self.append('<div class="{1}-search"><span class="{1}-add hidden"><i class="fa fa-plus"></i></span><span class="{1}-button"><i class="fa fa-search"></i></span><div><input type="text" placeholder="{0}" class="{1}-search-input" name="dir{2}" autocomplete="dir{2}" /></div></div><div class="{1}-container"><ul></ul></div>'.format(config.placeholder, cls, Date.now()));
		container = self.find('ul');
		input = self.find('input');
		icon = self.find(cls2 + '-button').find('.fa');
		plus = self.find(cls2 + '-add');

		self.event('mouseenter mouseleave', 'li', function() {
			if (ready) {
				container.find('li.current').rclass('current');
				$(this).aclass('current');
				var arr = container.find('li:visible');
				for (var i = 0; i < arr.length; i++) {
					if ($(arr[i]).hclass('current')) {
						selectedindex = i;
						break;
					}
				}
			}
		});

		self.event('click', cls2 + '-button', function(e) {
			input.val('');
			self.search();
			e.stopPropagation();
			e.preventDefault();
		});

		self.event('click', cls2 + '-add', function() {
			if (self.opt.callback) {
				self.opt.callback(input.val(), self.opt.element, true);
				self.hide();
			}
		});

		self.event('click', 'li', function(e) {
			self.opt.callback && self.opt.callback(self.opt.items[+this.getAttribute('data-index')], self.opt.element);
			self.hide();
			e.preventDefault();
			e.stopPropagation();
		});

		var e_click = function(e) {
			is && !$(e.target).hclass(cls + '-search-input') && self.hide(0);
		};

		var e_resize = function() {
			is && self.hide(0);
		};

		self.bindedevents = false;

		self.bindevents = function() {
			if (!self.bindedevents) {
				$(document).on('click', e_click);
				$(window).on('resize', e_resize);
				self.bindedevents = true;
			}
		};

		self.unbindevents = function() {
			if (self.bindedevents) {
				self.bindedevents = false;
				$(document).off('click', e_click);
				$(window).off('resize', e_resize);
			}
		};

		self.event('keydown', 'input', function(e) {
			var o = false;
			switch (e.which) {
				case 8:
					skipclear = false;
					break;
				case 27:
					o = true;
					self.hide();
					break;
				case 13:
					o = true;
					var sel = self.find('li.current');
					if (self.opt.callback) {
						if (sel.length)
							self.opt.callback(self.opt.items[+sel.attrd('index')], self.opt.element);
						else
							self.opt.callback(this.value, self.opt.element, true);
					}
					self.hide();
					break;
				case 38: // up
					o = true;
					selectedindex--;
					if (selectedindex < 0)
						selectedindex = 0;
					else
						self.move();
					break;
				case 40: // down
					o = true;
					selectedindex++ ;
					if (selectedindex >= resultscount)
						selectedindex = resultscount;
					else
						self.move();
					break;
			}

			if (o) {
				e.preventDefault();
				e.stopPropagation();
			}

		});

		self.event('input', 'input', function() {
			setTimeout2(self.ID, self.search, 100, null, this.value);
		});

		var fn = function() {
			is && self.hide(1);
		};

		self.on('reflow', fn);
		self.on('scroll', fn);
		self.on('resize', fn);
		$(window).on('scroll', fn);
	};

	self.move = function() {
		var counter = 0;
		var scroller = container.parent();
		var h = scroller.height();

		container.find('li').each(function() {
			var el = $(this);

			if (el.hclass('hidden')) {
				el.rclass('current');
				return;
			}

			var is = selectedindex === counter;
			el.tclass('current', is);

			if (is) {
				var t = (h * counter) - h;
				if ((t + h * 4) > h)
					scroller.scrollTop(t - h);
				else
					scroller.scrollTop(0);
			}
			counter++;
		});
	};

	self.search = function(value) {

		if (!self.opt)
			return;

		icon.tclass('fa-times', !!value).tclass('fa-search', !value);
		self.opt.custom && plus.tclass('hidden', !value);

		if (!value && !self.opt.ajax) {
			if (!skipclear)
				container.find('li').rclass('hidden');
			if (!skipreset)
				selectedindex = 0;
			resultscount = self.opt.items ? self.opt.items.length : 0;
			self.move();
			return;
		}

		resultscount = 0;
		selectedindex = 0;

		if (self.opt.ajax) {
			var val = value || '';
			if (self.ajaxold !== val) {
				self.ajaxold = val;
				setTimeout2(self.ID, function(val) {
					self.opt.ajax(val, function(items) {
						var builder = [];
						var indexer = {};
						for (var i = 0; i < items.length; i++) {
							var item = items[i];
							if (self.opt.exclude && self.opt.exclude(item))
								continue;
							indexer.index = i;
							resultscount++;
							builder.push(self.template(item, indexer));
						}
						skipclear = true;
						self.opt.items = items;
						container.html(builder);
						self.move();
					});
				}, 300, null, val);
			}
		} else if (value) {
			value = value.toSearch();
			container.find('li').each(function() {
				var el = $(this);
				var val = el.attrd('search').toSearch();
				var is = val.indexOf(value) === -1;
				el.tclass('hidden', is);
				if (!is)
					resultscount++;
			});
			skipclear = true;
			self.move();
		}
	};

	self.show = function(opt) {

		// opt.element
		// opt.items
		// opt.callback(value, el)
		// opt.offsetX     --> offsetX
		// opt.offsetY     --> offsetY
		// opt.offsetWidth --> plusWidth
		// opt.placeholder
		// opt.render
		// opt.custom
		// opt.minwidth
		// opt.maxwidth
		// opt.key
		// opt.exclude    --> function(item) must return Boolean
		// opt.search
		// opt.selected   --> only for String Array "opt.items"

		var el = opt.element instanceof jQuery ? opt.element[0] : opt.element;

		if (opt.items == null)
			opt.items = EMPTYARRAY;

		self.tclass(cls + '-default', !opt.render);

		if (!opt.minwidth)
			opt.minwidth = 200;

		if (is) {
			clearTimeout(timeout);
			if (self.target === el) {
				self.hide(1);
				return;
			}
		}

		self.initializing = true;
		self.target = el;
		opt.ajax = null;

		var element = $(opt.element);
		var callback = opt.callback;
		var items = opt.items;
		var type = typeof(items);
		var item;

		if (type === 'function' && callback) {
			opt.ajax = items;
			type = '';
			items = null;
		}

		if (type === 'string')
			items = self.get(items);

		if (!items && !opt.ajax) {
			self.hide(0);
			return;
		}

		self.bindevents();

		self.tclass(cls + '-search-hidden', opt.search === false);

		self.opt = opt;
		opt.class && self.aclass(opt.class);

		input.val('');
		var builder = [];
		var ta = opt.key ? Tangular.compile(template.replace(/\{\{\sname/g, '{{ ' + opt.key)) : self.template;
		var selected = null;

		if (!opt.ajax) {
			var indexer = {};
			for (var i = 0; i < items.length; i++) {
				item = items[i];

				if (typeof(item) === 'string')
					item = { name: item, id: item, selected: item === opt.selected };

				if (opt.exclude && opt.exclude(item))
					continue;

				if (item.selected) {
					selected = i;
					skipreset = true;
				}

				indexer.index = i;
				builder.push(ta(item, indexer));
			}

			if (opt.empty) {
				item = {};
				item[opt.key || 'name'] = opt.empty;
				item.template = '<b>{0}</b>'.format(opt.empty);
				indexer.index = -1;
				builder.unshift(ta(item, indexer));
			}
		}

		self.target = element[0];

		var offset = element.offset();
		var width = element.width() + (opt.offsetWidth || 0);

		if (opt.minwidth && width < opt.minwidth)
			width = opt.minwidth;
		else if (opt.maxwidth && width > opt.maxwidth)
			width = opt.maxwidth;

		ready = false;

		opt.ajaxold = null;
		plus.aclass('hidden');
		self.find('input').prop('placeholder', opt.placeholder || config.placeholder);
		var scroller = self.find(cls2 + '-container').css('width', width + 30);
		container.html(builder);

		var options = { left: offset.left + (opt.offsetX || 0), top: offset.top + (opt.offsetY || 0), width: width };
		self.css(options);

		!isMOBILE && setTimeout(function() {
			ready = true;
			input.focus();
		}, 200);

		setTimeout(function() {
			self.initializing = false;
			is = true;
			if (selected == null)
				scroller[0].scrollTop = 0;
			else
				scroller[0].scrollTop = container.find('.selected').offset().top - (self.element.height() / 2 >> 0);
		}, 50);

		if (is) {
			self.search();
			return;
		}

		selectedindex = selected || 0;
		resultscount = items ? items.length : 0;
		skipclear = true;

		self.search();
		self.rclass('hidden');

		setTimeout(function() {
			if (self.opt && self.target && self.target.offsetParent)
				self.aclass(cls + '-visible');
			else
				self.hide(1);
		}, 100);

		skipreset = false;
	};

	self.hide = function(sleep) {
		if (!is || self.initializing)
			return;
		clearTimeout(timeout);
		timeout = setTimeout(function() {
			self.unbindevents();
			self.rclass(cls + '-visible').aclass('hidden');
			if (self.opt) {
				self.opt.close && self.opt.close();
				self.opt.class && self.rclass(self.opt.class);
				self.opt = null;
			}
			is = false;
		}, sleep ? sleep : 100);
	};
});

COMPONENT('exec', function(self, config) {
	self.readonly();
	self.blind();
	self.make = function() {

		var scopepath = function(el, val) {
			if (!scope)
				scope = el.scope();
			return scope ? scope.makepath ? scope.makepath(val) : val.replace(/\?/g, el.scope().path) : val;
		};

		var fn = function(plus) {
			return function(e) {

				var el = $(this);
				var attr = el.attrd('exec' + plus);
				var path = el.attrd('path' + plus);
				var href = el.attrd('href' + plus);
				var def = el.attrd('def' + plus);
				var reset = el.attrd('reset' + plus);

				scope = null;

				if (el.attrd('prevent' + plus) === 'true') {
					e.preventDefault();
					e.stopPropagation();
				}

				if (attr) {
					if (attr.indexOf('?') !== -1)
						attr = scopepath(el, attr);
					EXEC(attr, el, e);
				}

				href && NAV.redirect(href);

				if (def) {
					if (def.indexOf('?') !== -1)
						def = scopepath(el, def);
					DEFAULT(def);
				}

				if (reset) {
					if (reset.indexOf('?') !== -1)
						reset = scopepath(el, reset);
					RESET(reset);
				}

				if (path) {
					var val = el.attrd('value');
					if (val) {
						if (path.indexOf('?') !== -1)
							path = scopepath(el, path);
						var v = GET(path);
						SET(path, new Function('value', 'return ' + val)(v), true);
					}
				}
			};
		};

		self.event('dblclick', config.selector2 || '.exec2', fn('2'));
		self.event('click', config.selector || '.exec', fn(''));
	};
});

COMPONENT('grid', 'filter:true;external:false;fillcount:50;filterlabel:Filtering values ...;boolean:true|on|yes;pluralizepages:# pages,# page,# pages,# pages;pluralizeitems:# items,# item,# items,# items;pagination:false;rowheight:30', function(self, config) {

	var tbody, thead, tbodyhead, container, pagination;
	var options = { columns: {}, items: [], indexer: 0, filter: {} };
	var isFilter = false;
	var ppages, pitems, cache, eheight, wheight, scroll, filtercache, filled = false;

	self.template = Tangular.compile('<td data-index="{{ index }}"{{ if $.cls }} class="{{ $.cls }}"{{ fi }}><div class="wrap{{ if align }} {{ align }}{{ fi }}"{{ if background }} style="background-color:{{ background }}"{{ fi }}>{{ value | raw }}</div></td>');
	self.options = options;
	self.readonly();
	self.nocompile && self.nocompile();

	self.make = function() {

		var meta = self.find('script').html();
		self.aclass('ui-grid-container' + (config.autosize ? '' : ' hidden'));
		self.html('<div class="ui-grid"><table class="ui-grid-header"><thead></thead></table><div class="ui-grid-scroller"><table class="ui-grid-data"><thead></thead><tbody></tbody></table></div></div>' + (config.pagination ? '<div class="ui-grid-footer hidden"><div class="ui-grid-meta"></div><div class="ui-grid-pagination"><button class="ui-grid-button" name="first"><i class="fa fa-angle-double-left"></i></button><button class="ui-grid-button" name="prev"><i class="fa fa-angle-left"></i></button><div class="page"><input type="text" maxlength="5" class="ui-grid-input" /></div><button class="ui-grid-button" name="next"><i class="fa fa-angle-right"></i></button><button class="ui-grid-button" name="last"><i class="fa fa-angle-double-right"></i></button></div><div class="ui-grid-pages"></div></div></div>' : ''));

		var body = self.find('.ui-grid-data');
		tbody = $(body.find('tbody')[0]);
		tbodyhead = $(body.find('thead')[0]);
		thead = $(self.find('.ui-grid-header').find('thead')[0]);
		container = $(self.find('.ui-grid-scroller')[0]);

		if (config.pagination) {
			var el = self.find('.ui-grid-footer');
			pagination = {};
			pagination.main = el;
			pagination.page = el.find('input');
			pagination.first = el.find('button[name="first"]');
			pagination.last = el.find('button[name="last"]');
			pagination.prev = el.find('button[name="prev"]');
			pagination.next = el.find('button[name="next"]');
			pagination.meta = el.find('.ui-grid-meta');
			pagination.pages = el.find('.ui-grid-pages');
		}

		meta && self.meta(meta);

		self.event('click', '.ui-grid-columnsort', function() {
			var obj = {};
			obj.columns = options.columns;
			obj.column = options.columns[+$(this).attrd('index')];
			self.sort(obj);
		});

		self.event('change', '.ui-grid-filter', function() {
			var el = $(this).parent();
			if (this.value)
				options.filter[this.name] = this.value;
			else
				delete options.filter[this.name];
			el.tclass('ui-grid-selected', !!this.value);
			scroll = true;
			self.filter();
		});

		self.event('change', 'input', function() {
			var el = this;
			if (el.type === 'checkbox') {
				el && !el.value && self.checked(el.checked);
				config.checked && EXEC(config.checked, el, self);
			}
		});

		self.event('click', '.ui-grid-button', function() {
			switch (this.name) {
				case 'first':
					scroll = true;
					cache.page = 1;
					self.operation('pagination');
					break;
				case 'last':
					scroll = true;
					cache.page = cache.pages;
					self.operation('pagination');
					break;
				case 'prev':
					scroll = true;
					cache.page -= 1;
					self.operation('pagination');
					break;
				case 'next':
					scroll = true;
					cache.page += 1;
					self.operation('pagination');
					break;
			}
		});

		self.event('change', '.ui-grid-input', function() {
			var page = (+this.value) >> 0;
			if (isNaN(page) || page < 0 || page > cache.pages || page === cache.page)
				return;
			scroll = true;
			cache.page = page;
			self.operation('pagination');
		});

		tbody.on('click', 'button', function() {
			var btn = $(this);
			var tr = btn.closest('tr');
			config.button && EXEC(config.button, btn, options.items[+tr.attrd('index')], self);
		});

		var ALLOWED = { INPUT: 1, SELECT: 1 };

		tbody.on('click', '.ui-grid-row', function(e) {
			!ALLOWED[e.target.nodeName] && config.click && EXEC(config.click, options.items[+$(this).attrd('index')], self);
		});

		self.on('resize', self.resize);
		config.init && EXEC(config.init);
		wheight = WH;
	};

	self.checked = function(value) {
		if (typeof(value) === 'boolean')
			self.find('input[type="checkbox"]').prop('checked', value);
		else
			return tbody.find('input:checked');
	};

	self.meta = function(html) {

		switch (typeof(html)) {
			case 'string':
				options.columns = new Function('return ' + html.trim())();
				break;
			case 'function':
				options.columns = html(self);
				break;
			case 'object':
				options.columns = html;
				break;
		}

		options.columns = options.columns.remove(function(column) {
			return !!(column.remove && FN(column.remove)());
		});

		options.customsearch = false;

		for (var i = 0; i < options.columns.length; i++) {
			var column = options.columns[i];

			if (typeof(column.header) === 'string')
				column.header = column.header.indexOf('{{') === -1 ? new Function('return \'' + column.header + '\'') : Tangular.compile(column.header);

			if (typeof(column.template) === 'string')
				column.template = column.template.indexOf('{{') === -1 ? new Function('a', 'b', 'return \'' + column.template + '\'') : Tangular.compile(column.template);

			if (column.search) {
				options.customsearch = true;
				column.search = column.search === true ? column.template : Tangular.compile(column.search);
			}
		}

		self.rebuild(true);
	};

	self.configure = function(key, value) {
		switch (key) {
			case 'pluralizepages':
				ppages = value.split(',').trim();
				break;
			case 'pluralizeitems':
				pitems = value.split(',').trim();
				break;
		}
	};

	self.cls = function(d) {
		var a = [];
		for (var i = 1; i < arguments.length; i++) {
			var cls = arguments[i];
			cls && a.push(cls);
		}
		return a.length ? ((d ? ' ' : '') + a.join(' ')) : '';
	};

	self.rebuild = function(init) {

		var data = ['<tr class="ui-grid-empty">'];
		var header = ['<tr>'];
		var filter = ['<tr>'];

		var size = 0;
		var columns = options.columns;
		var scrollbar = SCROLLBARWIDTH();
		var col;

		for (var i = 0, length = columns.length; i < length; i++) {
			col = columns[i];

			if (typeof(col.size) !== 'string')
				size += col.size || 1;

			col.sorting = null;

			if (typeof(col.render) === 'string')
				col.render = FN(col.render);

			if (typeof(col.header) === 'string')
				col.header = FN(col.header);

			col.cls = self.cls(0, col.classtd, col.class);
		}

		for (var i = 0, length = columns.length; i < length; i++) {
			col = columns[i];
			var width = typeof(col.size) === 'string' ? col.size : ((((col.size || 1) / size) * 100).floor(2) + '%');

			data.push('<td style="width:{0}" data-index="{1}" class="{2}"></td>'.format(width, i, self.cls(0, col.classtd, col.class)));
			header.push('<th class="ui-grid-columnname{3}{5}" style="width:{0};text-align:center" data-index="{1}" title="{6}" data-name="{4}"><div class="wrap"><i class="fa hidden ui-grid-fa"></i>{2}</div></th>'.format(width, i, col.header ? col.header(col) : (col.text || col.name), self.cls(1, col.classth, col.class), col.name, col.sort === false ? '' : ' ui-grid-columnsort', col.title || col.text || col.name));
			if (col.filter === false)
				filter.push('<th class="ui-grid-columnfilterempty ui-grid-columnfilter{1}" style="width:{0}">&nbsp;</th>'.format(width, self.cls(1, col.classfilter, col.class)));
			else
				filter.push('<th class="ui-grid-columnfilter{4}" style="width:{0}"><input type="text" placeholder="{3}" name="{2}" autocomplete="off" class="ui-grid-filter" /></th>'.format(width, i, col.name, col.filter || config.filterlabel, self.cls(1, col.classfilter, col.class)));
		}

		if (scrollbar) {
			header.push('<th class="ui-grid-columnname ui-grid-scrollbar" style="width:{0}px"></th>'.format(scrollbar));
			filter.push('<th class="ui-grid-columnfilterempty ui-grid-scrollbar ui-grid-columnfilter{1}" style="width:{0}px">&nbsp;</th>'.format(scrollbar, self.cls(1, col.classtd, col.class)));
		}

		tbodyhead.html(data.join('') + '</tr>');
		thead.html(header.join('') + '</tr>' + (config.filter ? (filter.join('') + '</tr>') : ''));
		!init && self.refresh();
		isFilter = false;
		options.filter = {};
	};

	self.fill = function() {

		if (config.autosize === false || filled)
			return;

		filled = true;
		tbody.find('.emptyfill').remove();
		var builder = ['<tr class="emptyfill">'];

		var cols = options.columns;
		for (var i = 0, length = cols.length; i < length; i++) {
			var col = cols[i];
			if (!col.hidden) {
				var cls = self.cls(0, col.classtd, col.class);
				builder.push('<td{0}>'.format(cls ? (' class="' + cls + '"') : '') + (i ? '' : '<div class="wrap">&nbsp;</div>') + '</td>');
			}
		}

		builder.push('</tr>');
		builder = builder.join('');
		var buffer = [];
		for (var i = 0; i < config.fillcount; i++)
			buffer.push(builder);
		tbody.append(buffer.join(''));
	};

	self.resize = function(delay) {

		if (config.autosize === false) {
			self.hclass('hidden') && self.rclass('hidden');
			return;
		}

		setTimeout2(self.id + '.resize', function() {

			var parent = self.parent().height();
			if (parent < wheight / 3)
				return;

			var value = options.items;
			var height = parent - (config.padding || 0) - (config.pagination ? 105 : 74);

			if (height === eheight)
				return;

			container.height(height);
			eheight = height;

			var cls = 'ui-grid-noscroll';
			var count = (height / config.rowheight) >> 0;
			if (count > value.length) {
				self.fill(config.fillcount);
				self.aclass(cls);
			} else
				self.rclass(cls);

			pagination && pagination.main.rclass('hidden');
			eheight && self.rclass('hidden');
		}, typeof(delay) === 'number' ? delay : 50);
	};

	self.limit = function() {
		return Math.ceil(container.height() / config.rowheight);
	};

	self.filter = function() {
		isFilter = Object.keys(options.filter).length > 0;
		!config.external && self.refresh();
		self.operation('filter');
	};

	self.operation = function(type) {
		if (type === 'filter')
			cache.page = 1;
		config.exec && EXEC(config.exec, type, isFilter ? options.filter : null, options.lastsort ? options.lastsort : null, cache.page, self);
	};

	self.sort = function(data) {

		options.lastsortelement && options.lastsortelement.rclass('fa-chevron-down fa-chevron-up').aclass('hidden');

		if (data.column.sorting === 'desc') {
			options.lastsortelement.find('.ui-grid-fa').rclass('fa-chevron-down fa-chevron-up').aclass('hidden');
			options.lastsortelement = null;
			options.lastsort = null;
			data.column.sorting = null;

			if (config.external)
				self.operation('sort');
			else
				self.refresh();

		} else if (data.column) {
			data.column.sorting = data.column.sorting === 'asc' ? 'desc' : 'asc';
			options.lastsortelement = thead.find('th[data-name="{0}"]'.format(data.column.name)).find('.ui-grid-fa').rclass('hidden').tclass('fa-chevron-down', data.column.sorting === 'asc').tclass('fa-chevron-up', data.column.sorting === 'desc');
			options.lastsort = data.column;

			var name = data.column.name;
			var sort = data.column.sorting;

			!config.external && options.lastsort && options.items.quicksort(name, sort !== 'asc');
			self.operation('sort');
			self.redraw();
		}
	};

	self.can = function(row) {

		var keys = Object.keys(options.filter);

		for (var i = 0; i < keys.length; i++) {

			var column = keys[i];
			var filter = options.filter[column];
			var val2 = filtercache[column];
			var val = row['$' + column] || row[column];

			var type = typeof(val);

			if (val instanceof Array) {
				val = val.join(' ');
				type = 'string';
			}

			if (type === 'number') {

				if (val2 == null)
					val2 = filtercache[column] = self.parseNumber(filter);

				if (val2.length === 1 && val !== val2[0])
					return false;

				if (val < val2[0] || val > val2[1])
					return false;

			} else if (type === 'string') {

				if (val2 == null) {
					val2 = filtercache[column] = filter.split(/\/\|\\|,/).trim();
					for (var j = 0; j < val2.length; j++)
						val2[j] = val2[j].toSearch();
				}

				var is = false;
				var s = val.toSearch();

				for (var j = 0; j < val2.length; j++) {
					if (s.indexOf(val2[j]) !== -1) {
						is = true;
						break;
					}
				}

				if (!is)
					return false;

			} else if (type === 'boolean') {
				if (val2 == null)
					val2 = filtercache[column] = config.boolean.indexOf(filter.replace(/\s/g, '')) !== -1;
				if (val2 !== val)
					return false;
			} else if (val instanceof Date) {

				val.setHours(0);
				val.setMinutes(0);

				if (val2 == null) {

					val2 = filter.trim().replace(/\s-\s/, '/').split(/\/|\||\\|,/).trim();
					var arr = filtercache[column] = [];

					for (var j = 0; j < val2.length; j++) {
						var dt = val2[j].trim();
						var a = self.parseDate(dt);
						if (a instanceof Array) {
							if (val2.length === 2) {
								arr.push(j ? a[1] : a[0]);
							} else {
								arr.push(a[0]);
								if (j === val2.length - 1) {
									arr.push(a[1]);
									break;
								}
							}
						} else
							arr.push(a);
					}

					if (val2.length === 2 && arr.length === 2) {
						arr[1].setHours(23);
						arr[1].setMinutes(59);
						arr[1].setSeconds(59);
					}

					val2 = arr;
				}

				if (val2.length === 1 && val.format('yyyyMMdd') !== val2[0].format('yyyyMMdd'))
					return false;

				if (val < val2[0] || val > val2[1])
					return false;
			} else
				return false;
		}

		return true;
	};

	self.parseDate = function(val) {
		var index = val.indexOf('.');
		var a;
		if (index === -1) {
			if ((/[a-z]+/).test(val)) {
				var dt = NOW.add(val);
				return dt > NOW ? [NOW, dt] : [dt, NOW];
			}
			if (val.length === 4)
				return [new Date(+val, 0, 1), new Date(+val + 1, 0	, 1)];
		} else if (val.indexOf('.', index + 1) === -1) {
			a = val.split('.');
			return new Date(NOW.getFullYear(), +a[1] - 1, +a[0]);
		}
		index = val.indexOf('-');
		if (index !== -1 && val.indexOf('-', index + 1) === -1) {
			a = val.split('-');
			return new Date(NOW.getFullYear(), +a[0] - 1, +a[1]);
		}
		return val.parseDate();
	};

	self.parseNumber = function(val) {
		var arr = [];
		var num = val.replace(/\s-\s/, '/').replace(/\s/g, '').replace(/,/g, '.').split(/\/|\|\s-\s|\\/).trim();

		for (var i = 0, length = num.length; i < length; i++) {
			var n = num[i];
			arr.push(+n);
		}

		return arr;
	};

	self.reset = function() {
		options.filter = {};
		isFilter = false;
		thead.find('input').val('');
		thead.find('.ui-grid-selected').rclass('ui-grid-selected');
		options.lastsortelement && options.lastsortelement.rclass('fa-caret-down fa-caret-up');
		options.lastsortelement = null;
		if (options.lastsort)
			options.lastsort.sorting = null;
		options.lastsort = null;
	};

	self.redraw = function() {

		var items = options.items;
		var columns = options.columns;
		var builder = [];
		var m = {};

		for (var i = 0, length = items.length; i < length; i++) {
			builder.push('<tr class="ui-grid-row" data-index="' + i + '">');
			for (var j = 0, jl = columns.length; j < jl; j++) {
				var column = columns[j];
				var val = items[i][column.name];
				m.value = column.template ? column.template(items[i], column) : column.render ? column.render(val, column, items[i]) : val == null ? '' : Thelpers.encode((column.format ? val.format(column.format) : val));
				m.index = j;
				m.align = column.align;
				m.background = column.background;
				builder.push(self.template(m, column));
			}
			builder.push('</tr>');
		}

		tbody.find('.ui-grid-row').remove();
		tbody.prepend(builder.join(''));
		container.rclass('noscroll');
		scroll && container.prop('scrollTop', 0);
		scroll = false;
		eheight = 0;
		self.resize(0);
	};

	self.setter = function(value) {

		// value.items
		// value.limit
		// value.page
		// value.pages
		// value.count

		if (!value) {
			tbody.find('.ui-grid-row').remove();
			self.resize();
			return;
		}

		cache = value;

		if (config.pagination) {
			pagination.prev.prop('disabled', value.page === 1);
			pagination.first.prop('disabled', value.page === 1);
			pagination.next.prop('disabled', value.page >= value.pages);
			pagination.last.prop('disabled', value.page === value.pages);
			pagination.page.val(value.page);
			pagination.meta.html(value.count.pluralize.apply(value.count, pitems));
			pagination.pages.html(value.pages.pluralize.apply(value.pages, ppages));
		}

		if (options.customsearch) {
			for (var i = 0, length = value.items.length; i < length; i++) {
				var item = value.items[i];
				for (var j = 0; j < options.columns.length; j++) {
					var col = options.columns[j];
					if (col.search)
						item['$' + col.name] = col.search(item);
				}
			}
		}

		if (config.external) {
			options.items = value.items;
		} else {
			options.items = [];
			filtercache = {};
			for (var i = 0, length = value.items.length; i < length; i++) {
				var item = value.items[i];
				if (isFilter && !self.can(item))
					continue;
				options.items.push(item);
			}
			options.lastsort && options.items.quicksort(options.lastsort.name, options.lastsort.sorting === 'asc');
		}

		self.redraw();
		config.checked && EXEC(config.checked, null, self);
	};
});

COMPONENT('table', 'highlight:true;unhighlight:true;multiple:false;pk:id', function(self, config) {

	var cls = 'ui-table';
	var cls2 = '.' + cls;
	var etable, ebody, eempty, ehead;
	var opt = { selected: [] };
	var templates = {};
	var sizes = {};
	var names = {};
	var aligns = {};
	var dcompile = false;

	self.readonly();
	self.nocompile();
	self.bindvisible();

	self.make = function() {

		self.aclass(cls + ' invisible' + (config.detail ? (' ' + cls + '-detailed') : '') + (config.highlight ? (' ' + cls + '-selectable') : '') + (config.border ? (' ' + cls + '-border') : ''));

		self.find('script').each(function() {

			var el = $(this);
			var type = el.attrd('type');

			switch (type) {
				case 'detail':
					var h = el.html();
					dcompile = h.COMPILABLE();
					templates.detail = Tangular.compile(h);
					return;
				case 'empty':
					templates.empty = el.html();
					return;
			}

			var display = el.attrd('display');
			var template = Tangular.compile(el.html());
			var size = (el.attrd('size') || '').split(',');
			var name = (el.attrd('head') || '').split(',');
			var align = (el.attrd('align') || '').split(',');
			var i;

			for (i = 0; i < align.length; i++) {
				switch (align[i].trim()) {
					case '0':
						align[i] = 'left';
						break;
					case '1':
						align[i] = 'center';
						break;
					case '2':
						align[i] = 'right';
						break;
				}
			}

			display = (display || '').split(',').trim();

			for (i = 0; i < align.length; i++)
				align[i] = align[i].trim();

			for (i = 0; i < size.length; i++)
				size[i] = size[i].trim();

			for (i = 0; i < name.length; i++) {
				name[i] = name[i].trim().replace(/'\w'/, function(val) {
					return '<i class="fa fa-{0}"></i>'.format(val.replace(/'/g, ''));
				});
			}

			if (!size[0] && size.length === 1)
				size = EMPTYARRAY;

			if (!align[0] && align.length === 1)
				align = EMPTYARRAY;

			if (!name[0] && name.length === 1)
				name = EMPTYARRAY;

			if (display.length) {
				for (i = 0; i < display.length; i++) {
					templates[display[i]] = template;
					sizes[display[i]] = size.length ? size : null;
					names[display[i]] = name.length ? name : null;
					aligns[display[i]] = align.length ? align : null;
				}
			} else {
				templates.lg = templates.md = templates.sm = templates.xs = template;
				sizes.lg = sizes.md = sizes.sm = sizes.xs = size.length ? size : null;
				names.lg = names.md = names.sm = names.xs = name.length ? name : null;
				aligns.lg = aligns.md = aligns.sm = aligns.xs = align.length ? align : null;
			}

		});

		self.html('<table class="{0}-table"><thead class="{0}-thead"></thead><tbody class="{0}-tbody"></tbody><tfooter class="{0}-tfooter hidden"></tfooter></table><div class="{0}-empty hidden"></div>'.format(cls));
		etable = self.find('table');
		ebody = etable.find('tbody');
		eempty = self.find(cls2 + '-empty').html(templates.empty || '');
		ehead = etable.find('thead');
		templates.empty && templates.empty.COMPILABLE() && COMPILE(eempty);

		var blacklist = { A: 1, BUTTON: 1 };

		ebody.on('click', '> tr', function(e) {

			if (!config.highlight)
				return;

			var el = $(this);
			var node = e.target;

			if (blacklist[node.tagName] || (node.tagName === 'SPAN' && node.getAttribute('class') || '').indexOf('link') !== -1)
				return;

			if (node.tagName === 'I') {
				var parent = $(node).parent();
				if (blacklist[parent[0].tagName] || (parent[0].tagName === 'SPAN' && parent.hclass('link')))
					return;
			}

			var index = +el.attrd('index');
			if (index > -1) {
				var is = el.hclass(cls + '-selected');
				if (config.multiple) {
					if (is) {
						if (config.unhighlight) {
							el.rclass(cls + '-selected');
							config.detail && self.row_detail(el);
							opt.selected = opt.selected.remove(index);
							config.exec && SEEX(config.exec, self.selected(), el);
						}
					} else {
						el.aclass(cls + '-selected');
						config.exec && SEEX(config.exec, self.selected(), el);
						config.detail && self.row_detail(el);
						opt.selected.push(index);
					}
				} else {

					if (is && !config.unhighlight)
						return;

					if (opt.selrow) {
						opt.selrow.rclass(cls + '-selected');
						config.detail && self.row_detail(opt.selrow);
						opt.selrow = null;
						opt.selindex = -1;
					}

					// Was selected
					if (is) {
						config.exec && SEEX(config.exec);
						return;
					}

					opt.selindex = index;
					opt.selrow = el;
					el.aclass(cls + '-selected');
					config.exec && SEEX(config.exec, opt.items[index], el);
					config.detail && self.row_detail(el);
				}
			}
		});

		var resize = function() {
			setTimeout2(self.ID, self.resize, 500);
		};

		if (W.OP)
			W.OP.on('resize', resize);
		else
			$(W).on('resize', resize);
	};

	self.resize = function() {
		var display = WIDTH();
		if (display !== opt.display && sizes[display] && sizes[display] !== sizes[opt.display])
			self.refresh();
	};

	self.row_detail = function(el) {

		var index = +el.attrd('index');
		var row = opt.items[index];
		var eld = el.next();

		if (el.hclass(cls + '-selected')) {

			// Row is selected
			if (eld.hclass(cls + '-detail')) {
				// Detail exists
				eld.rclass('hidden');
			} else {

				// Detail doesn't exist
				el.after('<tr class="{0}-detail"><td colspan="{1}" data-index="{2}"></td></tr>'.format(cls, el.find('td').length, index));
				eld = el.next();

				var tmp;

				if (config.detail === true) {
					tmp = eld.find('td');
					tmp.html(templates.detail(row, { index: index, user: window.user }));
					dcompile && COMPILE(tmp);
				} else {
					tmp = eld.find('td');
					EXEC(config.detail, row, function(row) {
						var is = typeof(row) === 'string';
						tmp.html(is ? row : templates.detail(row, { index: index, user: window.user }));
						if ((is && row.COMPILABLE()) || dcompile)
							COMPILE(tmp);
					}, tmp);
				}
			}

		} else
			eld.hclass(cls + '-detail') && eld.aclass('hidden');
	};

	self.redrawrow = function(index, row) {

		if (typeof(index) === 'number')
			index = ebody.find('tr[data-index="{0}"]'.format(index));

		if (index.length) {
			var template = templates[opt.display];
			var indexer = {};
			indexer.user = W.user;
			indexer.index = +index.attrd('index');
			var is = index.hclass(cls + '-selected');
			var next = index.next();
			index.replaceWith(template(row, indexer).replace('<tr', '<tr data-index="' + indexer.index + '"'));
			next.hclass(cls + '-detail') && next.remove();
			is && ebody.find('tr[data-index="{0}"]'.format(indexer.index)).trigger('click');
		}
	};

	self.appendrow = function(row) {

		var index = opt.items.indexOf(row);
		if (index == -1)
			index = opt.items.push(row) - 1;

		var template = templates[opt.display];
		var indexer = {};
		indexer.user = W.user;
		indexer.index = index;
		ebody.append(template(row, indexer).replace('<tr', '<tr data-index="' + indexer.index + '"'));
	};

	self.removerow = function(row) {
		var index = opt.items.indexOf(row);
		if (index == -1)
			return;
		opt.selected = opt.selected.remove(index);
		opt.items.remove(row);
	};

	self.selected = function() {
		var rows = [];
		for (var i = 0; i < opt.selected.length; i++) {
			var row = opt.items[opt.selected[i]];
			row && rows.push(row);
		}
		return rows;
	};

	self.setter = function(value) {

		if (value && value.items)
			value = value.items;

		var empty = !value || !value.length;
		var clsh = 'hidden';

		if (!self.isinit) {
			self.rclass('invisible', 10);
			self.isinit = true;
		}

		if (empty) {
			etable.aclass(clsh);
			eempty.rclass(clsh);
			return;
		}

		var display = WIDTH();
		var builder = [];
		var indexer = {};


		var selected = opt.selected.slice(0);

		for (var i = 0; i < selected.length; i++) {
			var row = opt.items[selected[i]];
			selected[i] = row[config.pk];
		}

		indexer.user = window.user;

		var template = templates[display];
		var count = 0;
		var size = sizes[display];
		var name = names[display];
		var align = aligns[display];

		if ((size && size.length) || (name && name.length) || (align && align.length)) {

			var arr = name || size || align;

			for (var i = 0; i < arr.length; i++)
				builder.push('<th style="width:{0};text-align:{2}">{1}</th>'.format(!size || size[i] === '0' ? 'auto' : size[i], name ? name[i] : '', align ? align[i] : 'left'));

			ehead.tclass(cls + '-nohead', !name);
			ehead.html('<tr>{0}</tr>'.format(builder.join('')));
			builder = [];
		} else
			ehead.html('');

		if (template) {
			for (var i = 0; i < value.length; i++) {
				var item = value[i];
				count++;
				indexer.index = i;
				builder.push(template(item, indexer).replace('<tr', '<tr data-index="' + i + '"'));
			}
		}

		opt.display = display;
		opt.items = value;
		opt.selindex = -1;
		opt.selrow = null;
		opt.selected = [];

		count && ebody.html(builder.join(''));

		eempty.tclass(clsh, count > 0);
		etable.tclass(clsh, count == 0);

		config.exec && SEEX(config.exec, config.multiple ? [] : null);

		if (config.remember) {
			for (var i = 0; i < selected.length; i++) {
				if (selected[i]) {
					var index = opt.items.findIndex(config.pk, selected[i]);
					if (index !== -1)
						ebody.find('tr[data-index="{0}"]'.format(index)).trigger('click');
				}
			}
		}
	};

});

COMPONENT('checkbox', function(self, config) {

	self.nocompile && self.nocompile();

	self.validate = function(value) {
		return (config.disabled || !config.required) ? true : (value === true || value === 'true' || value === 'on');
	};

	self.configure = function(key, value, init) {
		if (init)
			return;
		switch (key) {
			case 'label':
				self.find('span').html(value);
				break;
			case 'required':
				self.find('span').tclass('ui-checkbox-label-required', value);
				break;
			case 'disabled':
				self.tclass('ui-disabled', value);
				break;
			case 'checkicon':
				self.find('i').rclass2('fa-').aclass('fa-' + value);
				break;
		}
	};

	self.make = function() {
		self.aclass('ui-checkbox');
		self.html('<div><i class="fa fa-{2}"></i></div><span{1}>{0}</span>'.format(config.label || self.html(), config.required ? ' class="ui-checkbox-label-required"' : '', config.checkicon || 'check'));
		config.disabled && self.aclass('ui-disabled');
		self.event('click', function() {
			if (config.disabled)
				return;
			self.dirty(false);
			self.getter(!self.get());
		});
	};

	self.setter = function(value) {
		self.tclass('ui-checkbox-checked', !!value);
	};
});

COMPONENT('error', function(self, config) {

	self.readonly();
	self.nocompile && self.nocompile();

	self.make = function() {
		self.aclass('ui-error hidden');
	};

	self.setter = function(value) {

		if (!(value instanceof Array) || !value.length) {
			self.tclass('hidden', true);
			return;
		}

		var builder = [];
		for (var i = 0, length = value.length; i < length; i++)
			builder.push('<div><span class="fa {1}"></span>{0}</div>'.format(value[i].error, 'fa-' + (config.icon || 'times-circle')));

		self.html(builder.join(''));
		self.tclass('hidden', false);
	};
});

COMPONENT('editable', function(self, config) {

	var cls = 'ui-editable';
	var events = {};

	self.getter = null;
	self.setter = null;

	self.validate = function(value, init) {

		if (init)
			return true;

		var is = true;
		var arr = self.find('[data-editable]');

		for (var i = 0; i < arr.length; i++) {
			var el = $(arr[i]);
			var opt = self.parse(el);

			if (!opt || !opt.required)
				continue;

			if (opt.path) {
				var val = GET(opt.path);
				if (opt.validate && !opt.validate(val))
					is = false;
				else if (opt.type === 'number')
					is = val ? val > 0 || val < 0 : false;
				else if (opt.type === 'date')
					is = val ? val.getTime() > 0 : false;
				else if (opt.type === 'boolean')
					is = val ? true : false;
				else if (val instanceof Array)
					is = !!val.length;
				else
					is = val ? true : false;
				if (!is)
					break;
			}
		}

		return is;
	};

	self.makefn = function(val) {
		return (/\(|=|>|<|\+|-|\)/).test(val) ? FN('value=>' + val) : (function(path) { return function(value) { return GET(path)(value); }; })(val);
	};

	self.parse = function(el) {
		var t = el[0];
		if (t.$editable)
			return t.$editable;

		var opt = (el.attrd('editable') || '').parseConfig();

		if (!opt.path) {
			if (!opt.save) {
				// Internal hack for data-bind instance
				var binder = el[0].$jcbind;
				if (!binder)
					return;
				opt.path = binder.path;
				opt.binder = binder;
			}
		} else
			opt.path = self.path + '.' + opt.path;

		opt.html = el.html();

		if (opt.type)
			opt.type = opt.type.toLowerCase();

		if (opt.type === 'date' && !opt.format)
			opt.format = config.dateformat || 'yyyy-MM-dd';

		if (opt.type === 'bool')
			opt.type += 'ean';

		if (opt.validate)
			opt.validate = self.makefn(opt.validate);

		if (opt.accept)
			opt.accept = self.makefn(opt.accept);

		if (opt.raw == null)
			opt.raw = true;

		if (opt.can) {
			opt.canedit = function(el) {
				var opt = el[0].$editable;
				return (opt.can && !GET(opt.can)(opt, el)) || (config.can && !GET(config.can)(opt, el));
			};
		}

		t.$editable = opt;
		return opt;
	};

	self.moveend = function(el) {
		var range, selection, doc = document;
		if (doc.createRange) {
			range = doc.createRange();
			range.selectNodeContents(el[0]);
			range.collapse(false);
			selection = W.getSelection();
			selection.removeAllRanges();
			selection.addRange(range);
		} else if (doc.selection) {
			range = doc.body.createTextRange();
			range.moveToElementText(el[0]);
			range.collapse(false);
			range.select();
		}
	};

	self.cancel = function(opt, el) {
		opt.value = null;
		!opt.save && el.html('');
		self.approve2(el);
	};

	self.make = function() {

		self.aclass(cls);
		self.event('click', '[data-editable]', function() {

			var t = this;

			if (t.$editable && t.$editable.is)
				return;

			var el = $(t);
			var opt = self.parse(el);

			if (!opt || (opt.canedit && !opt.canedit(el)))
				return;

			opt.is = true;

			if (opt.dirsource) {

				opt.value = GET(opt.path) || el.text();

				if (!opt.dirvalue)
					opt.dirvalue = 'id';

				var attr = {};
				attr.element = el;
				attr.items = GET(opt.dirsource.replace(/\?/g, self.pathscope));
				attr.offsetY = -1;
				attr.placeholder = opt.dirplaceholder;
				attr.render = opt.dirrender ? GET(opt.dirrender.replace(/\?/g, self.pathscope)) : null;
				attr.custom = !!opt.dircustom;
				attr.offsetWidth = 2;
				attr.minwidth = opt.dirminwidth || 200;
				attr.maxwidth = opt.dirmaxwidth;
				attr.key = opt.dirkey || 'name';
				attr.empty = opt.dirempty;

				attr.exclude = function(item) {

					if (!item)
						return;

					if (typeof(item) === 'string')
						return item === opt.value;

					var v = item[opt.dirvalue || 'id'];
					return opt.value instanceof Array ? opt.value.indexOf(v) !== -1 : v === opt.value;
				};

				attr.close = function() {
					opt.is = false;
				};

				attr.callback = function(item, el, custom) {

					opt.is = false;

					// empty
					if (item == null) {
						self.cancel(opt, el);
						return;
					}

					var val = custom || typeof(item) === 'string' ? item : item[opt.dirvalue];
					if (custom && typeof(attr.dircustom) === 'string') {
						var fn = GET(attr.dircustom.replace(/\?/g, self.pathscope));
						fn(val, function(val) {
							if (val) {

								if (opt.accept && !opt.accept(val)) {
									self.cancel(opt, el);
									return;
								}

								if (typeof(val) === 'string') {
									opt.value = val;
									!opt.save && el.html(val);
								} else {
									opt.value = item[opt.dirvalue];
									!opt.save && el.html(val[attr.key]);
								}
								self.approve2(val);
							}
						});
					} else if (!custom) {

						if (opt.accept && !opt.accept(val)) {
							self.cancel(opt, el);
							return;
						}

						opt.value = val;
						!opt.save && el.html(typeof(item) === 'string' ? item : item[attr.key]);
						self.approve2(el);
					}
				};

				SETTER('directory', 'show', attr);

			} else if (opt.type === 'boolean') {
				TOGGLE(opt.path, 2);
				self.change(true);
				opt.is = false;
			} else if (opt.type === 'set') {
				SET(opt.path, new Function('return ' + (opt.value == null ? 'null' : opt.value))(), 2);
				self.change(true);
				opt.is = false;
			} else {

				opt.prev = opt.value = GET(opt.path);
				opt.html = el.html();

				if (opt.value == null || opt.value == '') {
					opt.value = opt.raw ? '' : opt.html;
					opt.raw && el.html('');
				}

				self.attach(el);
			}
		});

		events.keydown = function(e) {

			var t = this;

			if (!t.$events)
				return;

			if ((e.metaKey || e.ctrlKey) && (e.which === 66 || e.which === 76 || e.which === 73 || e.which === 85)) {
				if (t.$editable.type !== 'html') {
					e.preventDefault();
					e.stopPropagation();
				}
			}

			var el;

			if (e.which === 27) {
				el = $(t);
				self.cnotify(el, 'no');
				self.detach(el);
				return;
			}

			if (e.which === 13 || e.which === 9) {

				if (e.which === 13 && t.$editable.multiline)
					return;

				el = $(t);
				if (self.approve(el)) {
					self.detach(el);
					if (e.which === 9) {
						var arr = self.find('[data-editable]');
						for (var i = 0; i < arr.length; i++) {
							if (arr[i] === t) {
								var next = arr[i + 1];
								if (next) {
									$(next).trigger('click');
									e.preventDefault();
								}
								break;
							}
						}
					}
				} else
					e.preventDefault();
			}
		};

		events.blur = function() {
			if (this.$events) {
				var el = $(this);
				self.approve(el);
				self.detach(el);
			}
		};

		events.paste = function(e) {
			e.preventDefault();
			e.stopPropagation();
			var text = e.originalEvent.clipboardData.getData(self.attrd('clipboard') || 'text/plain');
			text && document.execCommand('insertText', false, text);
		};

		events.focus = function() {
			var t = this;
			if (t.$editable && t.$editable.is && t.$editable.autosource) {
				var attr = t.$editable;
				var opt = {};
				opt.element = $(t);
				opt.search = GET(attr.autosource);
				opt.offsetY = 10;
				opt.callback = function(item, el) {
					attr.value = typeof(item) === 'string' ? item : item[attr.autovalue || 'name'];
					el.html(attr.value);
					self.approve2(el);
				};
				SETTER('autocomplete', 'show', opt);
			}
		};
	};

	self.approve = function(el) {

		var opt = el[0].$editable;

		SETTER('!autocomplete', 'hide');

		var cur = el.html();
		if (opt.html === cur || (opt.raw && !cur))
			return true;

		var val = cur;

		if (opt.type !== 'html') {

			if (opt.multiline)
				val = val.replace(/<br(\s\/)?>/g, '\n').trim();

			val = val.replace(/&(gt|lt|nbsp|quot)+;/g, function(text) {
				switch (text) {
					case '&gt;':
						return '>';
					case '&lt;':
						return '<';
					case '&nbsp;':
						return ' ';
					case '&quot;':
						return '"';
				}
				return text;
			});
		}

		if (opt.maxlength && val.length > opt.maxlength)
			val = val.substring(0, opt.maxlength);

		opt.value = val;

		switch (opt.type) {
			case 'number':
				opt.value = opt.value.parseFloat();
				if ((opt.minvalue != null && opt.value < opt.minvalue) || (opt.maxvalue != null && opt.value > opt.maxvalue))
					return false;
				break;
			case 'date':
				SETTER('!datepicker', 'hide');
				opt.value = opt.value ? opt.value.parseDate(opt.format) : null;
				break;
			case 'boolean':
				opt.value = opt.value === true || opt.value == 'true' || opt.value == '1' || opt.value == 'on';
				break;
		}

		if (opt.accept && !opt.accept(val))
			return false;

		if ((opt.required && (opt.value == null || opt.value === '')) || (opt.validate && !opt.validate(opt.value)))
			return false;

		opt.html = null;
		self.approve2(el);
		return true;
	};

	self.cnotify = function(el, classname) {
		el.aclass(cls + '-' + classname);
		setTimeout(function() {
			el && el.rclass(cls + '-' + classname);
		}, 1000);
	};

	self.approve2 = function(el) {
		var opt = el[0].$editable;
		if (opt.save) {
			GET(opt.save)(opt, function(is) {
				el.html(is || is == null ? opt.value : opt.html);
				if (is || is == null)
					self.cnotify(el, 'ok');
				else
					self.cnotify(el, 'no');
			});
		} else {
			setTimeout(function() {
				var b = null;
				if (el.binder)
					b = el.binder();
				if (b)
					b.disabled = true;
				self.cnotify(el, 'ok');
				SET(opt.path, opt.value, 2);
				self.change(true);
				b && setTimeout(function() {
					b.disabled = false;
					opt.rebind && opt.binder && opt.binder.exec(GET(opt.binder.path), opt.binder.path);
				}, 100);
			}, 100);
		}
	};

	self.attach = function(el) {
		if (!el[0].$events) {

			var o = el[0].$editable;
			el[0].$events = true;

			el.aclass('editable-editing' + (o.multiline ? ' editable-multiline' : ''));
			el.on('focus', events.focus);
			el.on('keydown', events.keydown);
			el.on('blur', events.blur);
			el.on('paste', events.paste);
			el.attr('contenteditable', true);
			el.focus();
			self.moveend(el);

			if (o.type === 'date') {
				var opt = {};
				opt.element = el;
				opt.value = typeof(o.value) === 'string' ? o.value.parseDate(o.format) : o.value;
				opt.callback = function(date) {
					el.html(date.format(o.format));
					self.approve(el);
				};
				SETTER('datepicker', 'show', opt);
			}
		}
	};

	self.detach = function(el) {
		if (el[0].$events) {
			el.off('keydown', events.keydown);
			el.off('blur', events.blur);
			el.off('paste', events.paste);
			el[0].$events = false;
			var opt = el[0].$editable;
			if (opt.html != null)
				el.html(opt.html);
			opt.is = false;
			el.rclass('editable-editing editable-multiline');
			el.attr('contenteditable', false);
		}
	};

	self.setter = function(value, path, type) {
		if (type !== 2) {
			if (config.autofocus) {
				setTimeout(function() {
					self.find('[data-editable]').eq(0).trigger('click');
				}, 500);
			}
		}
	};

});

COMPONENT('selectbox', function(self, config) {

	var Eitems, Eselected, datasource, condition;

	self.datasource = EMPTYARRAY;
	self.template = Tangular.compile('<span data-search="{{ search }}" data-index="{{ index }}">{{ text }}</span>');
	self.nocompile && self.nocompile();

	self.validate = function(value) {
		return config.disabled || !config.required ? true : value && value.length > 0;
	};

	self.configure = function(key, value) {

		var redraw = false;

		switch (key) {
			case 'type':
				self.type = value;
				break;
			case 'disabled':
				self.tclass('ui-disabled', value);
				self.find('input').prop('disabled', value);
				if (value)
					self.rclass('ui-selectbox-invalid');
				else if (config.required)
					self.state(1, 1);
				break;
			case 'if':
				condition = value ? FN(value) : null;
				break;
			case 'required':
				!value && self.state(1, 1);
				break;
			case 'height':
			case 'search':
				redraw = true;
				break;
			case 'items':
				var arr = [];
				value.split(',').forEach(function(item) {
					item = item.trim().split('|');
					var obj = {};
					obj.name = item[0].trim();
					obj.id = (item[1] == null ? item[0] : item[1]).trim();
					if (config.type === 'number')
						obj.id = +obj.id;
					arr.push(obj);
				});
				self.bind('', arr);
				break;
			case 'datasource':
				datasource && self.unwatch(datasource, self.bind);
				self.watch(value, self.bind, true);
				datasource = value;
				break;
		}

		redraw && self.redraw();
	};

	self.search = function() {
		var search = config.search ? self.find('input').val().toSearch() : '';
		Eitems.find('span').each(function() {
			var el = $(this);
			el.tclass('hidden', el.attrd('search').indexOf(search) === -1);
		});
		self.find('.ui-selectbox-search-icon').tclass('fa-search', search.length === 0).tclass('fa-times', search.length > 0);
	};

	self.redraw = function() {
		self.html((typeof(config.search) === 'string' ? '<div class="ui-selectbox-search"><span><i class="fa fa-search ui-selectbox-search-icon"></i></span><div><input type="text" placeholder="{0}" /></div></div><div>'.format(config.search) : '') + '<div class="ui-selectbox-container" style="height:{0}px"><div class="ui-selectbox-area"><div class="ui-selectbox-body noscrollbar"></div></div><div class="ui-selectbox-area"><div class="ui-selectbox-body noscrollbar" style="height:{0}px"></div></div></div>'.format(config.height || '200'));
		self.find('.ui-selectbox-body').each(function(index) {
			if (index)
				Eselected = $(this);
			else
				Eitems = $(this);
		});
	};

	self.bind = function(path, value) {

		var kt = config.text || 'name';
		var kv = config.value || 'id';
		var builder = [];

		self.datasource = [];

		if (value) {
			var index = 0;
			for (var i = 0; i < value.length; i++) {
				var item = value[i];

				if (condition && !condition(item))
					continue;

				var text, val;

				if (typeof(item) === 'string') {
					text = item;
					val = self.parser(item);
				} else {
					text = item[kt];
					val = item[kv];
				}

				item = { text: text, value: val, index: index++, search: text.toSearch() };
				self.datasource.push(item);
				builder.push(self.template(item));
			}
		}

		Eitems.empty().append(builder.join(''));
		self.refresh();
		self.search();
	};

	self.make = function() {

		self.aclass('ui-selectbox');
		self.redraw();

		config.datasource && self.reconfigure('datasource:' + config.datasource);
		config.items && self.reconfigure('items:' + config.items);

		self.event('click', 'span', function() {
			if (config.disabled)
				return;
			var selected = self.get() || [];
			var index = +this.getAttribute('data-index');
			var value = self.datasource[index];

			if (selected.indexOf(value.value) === -1)
				selected.push(value.value);
			else
				selected = selected.remove(value.value);

			self.set(selected);
			self.change(true);
		});

		self.event('click', '.fa-times', function() {
			if (!config.disabled) {
				self.find('input').val('');
				self.search();
			}
		});

		typeof(config.search) === 'string' && self.event('keydown', 'input', function() {
			!config.disabled && setTimeout2(self.id, self.search, 500);
		});
	};

	self.setter = function(value, path, type) {

		var selected = {};
		var builder = [];

		var ds = self.datasource;
		var dsl = ds.length;

		if (value) {
			for (var i = 0, length = value.length; i < length; i++) {
				for (var j = 0; j < dsl; j++) {
					if (ds[j].value === value[i]) {
						selected[j] = true;
						builder.push(self.template(ds[j]));
					}
				}
			}
		}

		Eitems.find('span').each(function() {
			var el = $(this);
			var index = +el.attrd('index');
			el.tclass('ui-selectbox-selected', selected[index] !== undefined);
		});

		Eselected.empty().append(builder.join(''));
		self.search();

		if (type !== 1) {
			setTimeout(function() {
				Eitems[0].scrollTop = 0;
			}, 500);
		}
	};

	self.state = function(type) {
		if (type) {
			var invalid = config.required ? self.isInvalid() : false;
			if (invalid !== self.$oldstate) {
				self.$oldstate = invalid;
				self.tclass('ui-selectbox-invalid', invalid);
			}
		}
	};
});

COMPONENT('notifier', function(self) {

	var cls = 'ui-notitifier';
	var cls2 = '.' + cls;

	self.readonly();
	self.singleton();

	self.make = function() {
		self.aclass(cls);
	};

	self.append = function(body, callback) {
		var id = Date.now();
		var el = self.element;
		el.append('<div class="{0}-child hidden" data-id="{1}"></div>'.format(cls, id));
		el.find('{0}-child[data-id="{1}"]'.format(cls2, id)).append(body).on('click', function(e) {
			var el = $(this);
			callback && callback(e.target, function() {
				el.remove();
			});
		});
	};

});

COMPONENT('intro', function(self, config) {

	var cls = 'ui-intro';
	var cls2 = '.' + cls;
	var container = 'intro' + GUID(4);
	var content, figures, buttons, button = null;
	var index = 0;
	var visible = false;

	self.readonly();

	self.make = function() {
		$(document.body).append('<div id="{0}" class="hidden {1}"><div class="{1}-body"></div></div>'.format(container, cls));
		content = self.element;
		container = $('#' + container);
		content.rclass('hidden');
		var body = container.find(cls2 + '-body');
		body[0].appendChild(self.element[0]);
		self.replace(container);
		content.aclass('ui-intro-figures');
		figures = content.find('figure');
		var items = [];

		figures.each(function(index) {
			items.push('<i class="fa fa-circle {0}-button" data-index="{1}"></i>'.format(cls, index));
		});

		body.append('<div class="{0}-pagination"><button name="next"></button>{1}</div>'.format(cls, items.join('')));
		buttons = self.find(cls2 + '-button');
		button = self.find(cls2 + '-pagination').find('button');

		self.event('click', 'button[name="next"]', function() {
			index++;
			if (index >= figures.length) {
				self.set('');
				config.exec && EXEC(config.exec);
			} else {
				self.move(index);
				config.page && EXEC(config.page, index);
			}
		});

		self.event('click', 'button[name="close"]', function() {
			self.set('');
			config.exec && EXEC(config.exec, true);
			config.remove && self.remove();
		});

		self.event('click', cls2 + '-button', function() {
			self.move(+this.getAttribute('data-index'));
		});
	};

	self.move = function(indexer) {
		figures.filter('.visible').rclass('visible');
		buttons.filter('.selected').rclass('selected');
		figures.eq(indexer).aclass('visible');
		buttons.eq(indexer).aclass('selected');
		button.html(indexer < buttons.length - 1 ? ((config.next || 'Next') + '<i class="fa fa-chevron-right"></i>') : (config.close || 'Done'));
		index = indexer;
		return self;
	};

	self.setter = function(value) {
		var is = value == config.if;
		if (is === visible)
			return;
		index = 0;
		self.move(0);
		visible = is;
		self.tclass('hidden', !is);
		setTimeout(function() {
			self.find(cls2 + '-body').tclass(cls + '-body-visible', is);
		}, 100);
	};
});

COMPONENT('enter', 'validate:true', function(self, config) {
	self.readonly();
	self.make = function() {
		self.event('keydown', 'input', function(e) {
			if (e.which === 13 && (!config.validate || CAN(self.path))) {
				if (config.trigger)
					self.find(config.trigger).trigger('click');
				else
					EXEC(config.exec, self);
			}
		});
	};
});

COMPONENT('pin', 'blank:●;count:6', function(self, config) {

	var reg_validation = /[0-9]/;
	var inputs = null;
	var skip = false;
	var count = 0;

	self.nocompile && self.nocompile();

	self.validate = function(value, init) {
		return init ? true : config.required || config.disabled ? !!(value && value.indexOf(' ') === -1) : true;
	};

	self.configure = function(key, value, init) {
		if (init)
			return;
		switch (key) {
			case 'count':
				self.redraw();
				break;
			case 'disabled':
				self.find('input').prop('disabled', value);
				self.tclass('ui-disabled', value);
				!value && self.state(1, 1);
				break;
		}
	};

	self.redraw = function() {
		var builder = [];
		count = config.count;
		for (var i = 0; i < count; i++)
			builder.push('<div data-index="{0}" class="ui-pin-input"><input type="{1}" maxlength="1" autocomplete="pin{2}" name="pin{2}" pattern="[0-9]" /></div>'.format(i, isMOBILE ? 'tel' : 'text', Date.now() + i));
		self.html(builder.join(''));
	};

	self.make = function() {

		self.aclass('ui-pin');
		self.redraw();

		self.event('keypress', 'input', function(e) {
			var c = e.which;
			var t = this;
			if (c >= 48 && c <= 57) {
				var c = String.fromCharCode(e.charCode);
				if (t.value !== c)
					t.value = c;
				setTimeout(function(el) {
					var next = el.parent().next().find('input');
					next.length && next.focus();
				}, 50, $(t));
				self.mask();
			} else if (c > 30)
				e.preventDefault();
		});

		self.event('keydown', 'input', function(e) {
			e.which === 8 && setTimeout(function(el) {
				if (!el.val()) {
					el.attrd('value', '');
					var prev = el.parent().prev().find('input');
					prev.val() && prev.focus();
					self.mask();
				}
			}, 50, $(this));
		});

		inputs = self.find('input');
	};

	self.mask = function() {
		setTimeout2(self.id + '.mask', function() {
			inputs.each(function() {
				if (this.value && reg_validation.test(this.value)) {
					this.setAttribute('data-value', this.value);
					this.value = config.blank;
				}
			});
			self.getter();
		}, 300);
	};

	self.getter = function() {
		setTimeout2(self.id + '.getter', function() {
			var value = '';

			inputs.each(function() {
				value += this.getAttribute('data-value') || ' ';
			});

			if (self.get() !== value) {
				self.change(true);
				skip = true;
				self.set(value);
			}

		}, 100);
	};

	self.setter = function(value) {

		if (skip) {
			skip = false;
			return;
		}

		inputs.each(function(index) {
			this.setAttribute('data-value', (value || '').substring(index, index + 1));
			this.value = value ? config.blank : '';
		});
	};

	self.state = function(type) {
		if (!type)
			return;
		var invalid = config.required ? self.isInvalid() : false;
		if (invalid === self.$oldstate)
			return;
		self.$oldstate = invalid;
		self.tclass('ui-pin-invalid', invalid);
	};
});

COMPONENT('snackbar', 'timeout:4000;button:OK', function(self, config) {

	var show = true;
	var callback;
	var delay;

	self.readonly();
	self.blind();
	self.nocompile && self.nocompile();

	self.make = function() {
		self.aclass('ui-snackbar hidden');
		self.append('<div><span class="ui-snackbar-dismiss"></span><span class="ui-snackbar-icon"></span><div class="ui-snackbar-body"></div></div>');
		self.event('click', '.ui-snackbar-dismiss', function() {
			self.hide();
			callback && callback();
		});
	};

	self.hide = function() {
		clearTimeout2(self.ID);
		self.rclass('ui-snackbar-visible');
		if (delay) {
			clearTimeout(delay);
			self.aclass('hidden');
			delay = null;
		} else {
			delay = setTimeout(function() {
				delay = null;
				self.aclass('hidden');
			}, 1000);
		}
		show = true;
	};

	self.waiting = function(message, button, close) {
		self.show(message, button, close, 'fa-spinner fa-pulse');
	};

	self.success = function(message, button, close) {
		self.show(message, button, close, 'fa-check-circle');
	};

	self.warning = function(message, button, close) {
		self.show(message, button, close, 'fa-times-circle');
	};

	self.show = function(message, button, close, icon) {

		if (typeof(button) === 'function') {
			close = button;
			button = null;
		}

		callback = close;

		self.find('.ui-snackbar-icon').html('<i class="fa {0}"></i>'.format(icon || 'fa-info-circle'));
		self.find('.ui-snackbar-body').html(message).attr('title', message);
		self.find('.ui-snackbar-dismiss').html(button || config.button);

		if (show) {
			self.rclass('hidden');
			setTimeout(function() {
				self.aclass('ui-snackbar-visible');
			}, 50);
		}

		setTimeout2(self.ID, self.hide, config.timeout + 50);
		show = false;
	};
});

COMPONENT('message', function(self, config) {

	var cls = 'ui-message';
	var cls2 = '.' + cls;
	var is, visible = false;

	self.readonly();
	self.singleton();
	self.nocompile && self.nocompile();

	self.make = function() {
		self.aclass(cls + ' hidden');

		self.event('click', 'button', function() {
			self.hide();
		});

		$(window).on('keyup', function(e) {
			visible && e.which === 27 && self.hide();
		});
	};

	self.warning = function(message, icon, fn) {
		if (typeof(icon) === 'function') {
			fn = icon;
			icon = undefined;
		}
		self.callback = fn;
		self.content(cls + '-warning', message, icon || 'warning');
	};

	self.info = function(message, icon, fn) {
		if (typeof(icon) === 'function') {
			fn = icon;
			icon = undefined;
		}
		self.callback = fn;
		self.content(cls + '-info', message, icon || 'info-circle');
	};

	self.success = function(message, icon, fn) {

		if (typeof(icon) === 'function') {
			fn = icon;
			icon = undefined;
		}

		self.callback = fn;
		self.content(cls + '-success', message, icon || 'check-circle');
	};

	FUNC.messageresponse = function(success, callback) {
		return function(response, err) {
			if (err || response instanceof Array) {

				var msg = [];
				var template = '<div class="' + cls + '-error"><i class="fa fa-warning"></i>{0}</div>';

				if (response instanceof Array) {
					for (var i = 0; i < response.length; i++)
						msg.push(template.format(response[i].error));
					msg = msg.join('');
				} else
					msg = template.format(err.toString());

				self.warning(msg);
			} else {
				self.success(success);
				callback && callback(response);
			}
		};
	};

	self.hide = function() {
		self.callback && self.callback();
		self.aclass('hidden');
		visible = false;
	};

	self.content = function(classname, text, icon) {
		!is && self.html('<div><div class="ui-message-icon"><i class="fa fa-' + icon + '"></i></div><div class="ui-message-body"><div class="text"></div><hr /><button>' + (config.button || 'OK') + '</button></div></div>');
		visible = true;
		self.rclass2(cls + '-').aclass(classname);
		self.find(cls2 + '-body').rclass().aclass(cls + '-body');

		if (is)
			self.find(cls2 + '-icon').find('.fa').rclass2('fa-').aclass('fa-' + icon);

		self.find('.text').html(text);
		self.rclass('hidden');
		is = true;
		setTimeout(function() {
			self.aclass(cls + '-visible');
			setTimeout(function() {
				self.find(cls2 + '-icon').aclass(cls + '-icon-animate');
			}, 300);
		}, 100);
	};
});

COMPONENT('menu', function(self) {

	self.singleton();
	self.readonly();
	self.nocompile && self.nocompile();

	var cls = 'ui-menu';
	var is = false;
	var events = {};
	var ul;

	self.make = function() {
		self.aclass(cls + ' hidden');
		self.append('<ul></ul>');
		ul = self.find('ul');

		self.event('touchstart mousedown', 'li', function(e) {
			var el = $(this);
			if (el.hclass(cls + '-divider')) {
				e.preventDefault();
				e.stopPropagation();
			} else {
				self.opt.callback(self.opt.items[el.index()]);
				self.hide();
			}
		});

		events.hide = function() {
			is && self.hide();
		};

		self.event('scroll', events.hide);
		self.on('reflow', events.hide);
		self.on('scroll', events.hide);
		self.on('resize', events.hide);

		events.click = function(e) {
			if (is && (!self.target || (self.target !== e.target && !self.target.contains(e.target))))
				self.hide();
		};
	};

	self.bindevents = function() {
		events.is = true;
		$(document).on('touchstart mousedown', events.click);
		$(window).on('scroll', events.hide);
	};

	self.unbindevents = function() {
		events.is = false;
		$(document).off('touchstart mousedown', events.click);
		$(window).off('scroll', events.hide);
	};

	self.showxy = function(x, y, items, callback) {
		var opt = {};
		opt.x = x;
		opt.y = y;
		opt.items = items;
		opt.callback = callback;
		self.show(opt);
	};

	self.show = function(opt) {

		if (typeof(opt) === 'string') {
			// old version
			opt = { align: opt };
			opt.element = arguments[1];
			opt.items = arguments[2];
			opt.callback = arguments[3];
			opt.offsetX = arguments[4];
			opt.offsetY = arguments[5];
		}

		var tmp = opt.element ? opt.element instanceof jQuery ? opt.element[0] : opt.element.element ? opt.element.dom : opt.element : null;

		if (is && tmp && self.target === tmp) {
			self.hide();
			return;
		}

		var builder = [];

		self.target = tmp;
		self.opt = opt;

		for (var i = 0; i < opt.items.length; i++) {
			var item = opt.items[i];
			builder.push(typeof(item) == 'string' ? '<li class="{1}-divider">{0}</li>'.format(item === '-' ? '<hr />' : ('<span>' + item + '</span>'), cls) : '<li{2}>{3}{0}{1}</li>'.format(item.icon ? '<i class="fa fa-{0}"></i>'.format(item.icon) : '', item.name, item.icon ? '' : (' class="' + cls + '-nofa"'), item.shortcut ? '<b>{0}</b>'.format(item.shortcut) : ''));
		}

		var css = {};

		ul.html(builder.join(''));

		if (is) {
			css.left = 0;
			css.top = 0;
			self.element.css(css);
		} else {
			self.rclass('hidden');
			self.aclass(cls + '-visible', 100);
			is = true;
			if (!events.is)
				self.bindevents();
		}

		var target = $(opt.element);
		var w = self.width();
		var offset = target.offset();

		if (opt.element) {
			switch (opt.align) {
				case 'center':
					css.left = Math.ceil((offset.left - w / 2) + (target.innerWidth() / 2));
					break;
				case 'right':
					css.left = (offset.left - w) + target.innerWidth();
					break;
				default:
					css.left = offset.left;
					break;
			}
			css.top = offset.top + target.innerHeight() + 10;
		} else {
			css.left = opt.x;
			css.top = opt.y;
		}

		if (opt.offsetX)
			css.left += opt.offsetX;

		if (opt.offsetY)
			css.top += opt.offsetY;

		self.element.css(css);
	};

	self.hide = function() {
		events.is && self.unbindevents();
		is = false;
		self.target = null;
		self.opt = null;
		self.aclass('hidden');
		self.rclass(cls + '-visible');
	};

});

COMPONENT('confirm', function(self) {

	var is, visible = false;

	self.readonly();
	self.singleton();
	self.nocompile && self.nocompile();

	self.make = function() {

		self.aclass('ui-confirm hidden');

		self.event('click', 'button', function() {
			self.hide($(this).attrd('index').parseInt());
		});

		self.event('click', function(e) {
			var t = e.target.tagName;
			if (t !== 'DIV')
				return;
			var el = self.find('.ui-confirm-body');
			el.aclass('ui-confirm-click');
			setTimeout(function() {
				el.rclass('ui-confirm-click');
			}, 300);
		});

		$(window).on('keydown', function(e) {
			if (!visible)
				return;
			var index = e.which === 13 ? 0 : e.which === 27 ? 1 : null;
			if (index != null) {
				self.find('button[data-index="{0}"]'.format(index)).trigger('click');
				e.preventDefault();
				e.stopPropagation();
			}
		});
	};

	self.show = self.confirm = function(message, buttons, fn) {
		self.callback = fn;

		var builder = [];

		for (var i = 0; i < buttons.length; i++) {
			var item = buttons[i];
			var icon = item.match(/"[a-z0-9-]+"/);
			if (icon) {
				item = item.replace(icon, '').trim();
				icon = '<i class="fa fa-{0}"></i>'.format(icon.toString().replace(/"/g, ''));
			} else
				icon = '';
			builder.push('<button data-index="{1}">{2}{0}</button>'.format(item, i, icon));
		}

		self.content('ui-confirm-warning', '<div class="ui-confirm-message">{0}</div>{1}'.format(message.replace(/\n/g, '<br />'), builder.join('')));
	};

	self.hide = function(index) {
		self.callback && self.callback(index);
		self.rclass('ui-confirm-visible');
		visible = false;
		setTimeout2(self.id, function() {
			$('html').rclass('ui-confirm-noscroll');
			self.aclass('hidden');
		}, 1000);
	};

	self.content = function(cls, text) {
		$('html').aclass('ui-confirm-noscroll');
		!is && self.html('<div><div class="ui-confirm-body"></div></div>');
		self.find('.ui-confirm-body').empty().append(text);
		self.rclass('hidden');
		visible = true;
		setTimeout2(self.id, function() {
			self.aclass('ui-confirm-visible');
		}, 5);
	};
});