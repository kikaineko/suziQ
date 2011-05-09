/*!
 * suziQ is a JavaScript Tool for mock HTML.
 * https://github.com/kikaineko/suziQ
 *
 * Copyright 2011, Masayuki Ioki.
 * Licensed under the MIT.
 * https://github.com/kikaineko/suziQ/blob/master/License.txt
 *
 */
(function(jQuery) {
	if (jQuery.sq) {
		return;
	}
	jQuery.sq = function(arg1,arg2){
		if (arg1 && typeof(arg1) == "function") {
			jQuery.sq.setup={init: arg1};
			return;
		}
		if (arg2 && typeof(arg2) == "function") {
			var o={init: arg2};
			if(arg1 && typeof(arg1) == "string"){
				o={messages: arg1};
			}
			jQuery.sq.setup=o;
			return;
		}
	};
	jQuery.sq.version = "v0.5-2011.04.18";
	jQuery.sq.C = {};
	/**
	 * setting is open to user.
	 */
	jQuery.sq.settings = {};

	/**
	 * internal means private use in this file.
	 */
	jQuery.sq.internal = {};
	jQuery.sq.internal.localflag = null;
	jQuery.sq.production = false;

	jQuery.sq.setup = null;
	jQuery.sq.setup_error = null;
	jQuery.sq.internal.cash = {};

	jQuery.sq.noConflictWithJQuery = function() {
		jQuery.sq.event.noConflictWithJQuery();
	};

	jQuery.sq.event = {};
	jQuery.sq.event.internal = {};
	jQuery.sq.event.internal.fnc = {};
	jQuery.sq.event.internal.name = {};

	jQuery.sq.event.internal.logic = function(key, fnc, name) {
		if (fnc && typeof(fnc) == "function") {
			if (!name) {
				throw "if you add fnc to sq.event, you must define fnc name.";
			}

			if (!jQuery.sq.event.internal.fnc[key]) {
				jQuery.sq.event.internal.fnc[key] = [];
				jQuery.sq.event.internal.name[key] = [];
			}
			var arr = jQuery.sq.event.internal.fnc[key];
			arr[arr.length] = fnc;
			arr = jQuery.sq.event.internal.name[key];
			arr[arr.length] = name;
		} else {
			// fnc may be event object
			var arr = jQuery.sq.event.internal.fnc[key];
			if (arr) {
				var brr = [];
				for (var i = 0; i < arr.length; i++) {
					brr[i] = arr[i](fnc);
				}
				return brr;
			}
		}
	};

	jQuery.sq.event.fnc_index = function(event_name, fnc_name) {
		if (!jQuery.sq.event.internal.fnc[event_name]) {
			return -1;
		}
		var name_arr = jQuery.sq.event.internal.name[event_name];
		if (!name_arr) {
			return -1;
		}
		for (var i = 0; i < name_arr.length; i++) {
			if (name_arr[i] == fnc_name) {
				return i;
			}
		}
		return -1;
	};
	jQuery.sq.event.delete_fnc = function(event_name, fnc_index) {
		jQuery.sq.event.internal.name[event_name].splice(fnc_index, 1);
		var brr = jQuery.sq.event.internal.fnc[event_name];
		var f = brr[fnc_index];
		brr.splice(fnc_index, 1);
		return f;
	};
	jQuery.sq.event.insert_fnc = function(event_name, fnc, fnc_name, fnc_index) {
		var arr = jQuery.sq.event.internal.name[event_name];
		jQuery.sq.internal.insert(arr, fnc_index, fnc_name);
		arr = jQuery.sq.event.internal.fnc[event_name];
		jQuery.sq.internal.insert(arr, fnc_index, fnc);
	};
	jQuery.sq.internal.insert = function(arr, index, data) {
		for (var i = arr.length; i > index; i--) {
			arr[i] = arr[i - 1];
		}
		arr[index] = data;
	};

	jQuery.sq.event.noConflictWithJQuery = function(fnc, name) {
		return jQuery.sq.event.internal
				.logic("noConflictWithJQuery", fnc, name);
	};
	jQuery.sq.event.setup_before = function(fnc, name) {
		return jQuery.sq.event.internal.logic("setup_before", fnc, name);
	};
	jQuery.sq.event.change = function(fnc, name) {
		return jQuery.sq.event.internal.logic("change", fnc, name);
	};
	jQuery.sq.event.form_validate = function(fnc, name) {
		return jQuery.sq.event.internal.logic("form_validate", fnc, name);
	};
	jQuery.sq.event.form_format = function(fnc, name) {
		return jQuery.sq.event.internal.logic("form_format", fnc, name);
	};

	jQuery.sq.event.focus = function(fnc, name) {
		return jQuery.sq.event.internal.logic("focus", fnc, name);
	};
	jQuery.sq.event.blur = function(fnc, name) {
		return jQuery.sq.event.internal.logic("blur", fnc, name);
	};

	jQuery.sq.run_setup = function() {
		if (jQuery.sq.run_setup.lock) {
			return;
		}
		jQuery.sq.run_setup.lock = true;

		jQuery.sq.event.setup_before();

		if (jQuery.sq.setup) {
			try {
				jQuery.sq.internal.run_setup_takelocale(jQuery.sq.setup);
			} catch (e) {
				jQuery.sq.log("[SuziQ-1]" + e.toString());
				if (jQuery.sq.setup_error != null) {
					jQuery.sq.setup_error(e);
				}
			}
		}
	};
	jQuery.sq.run_setup.lock = false;

	jQuery.sq.internal.run_setup = {};

	jQuery.sq.internal.run_setup.message_cnt = 0;
	jQuery.sq.internal.run_setup.callback = null;

	jQuery.sq.internal.run_setup_takelocale = function(obj) {
		var locale = null;
		if (jQuery.sq.isLocalMode()) {
			if (window.name && window.name.indexOf("_sq_local_iframe") != -1) {
				return;
			}

			locale = jQuery.sq.locale();
			jQuery.sq.internal.cash["locale"] = locale;
			jQuery.sq.internal.dummy_data(obj.dummy_data);
			if (obj.messages) {
				jQuery.sq.internal.message_set(obj.messages, obj.init, locale);
			} else {
				obj.messages = {};
				if (obj.init) {
					obj.init(jQuery.sq.internal.data(),
							jQuery.sq.internal.messages);
				}
			}
		} else {
			// if you have no message file, we don't check locale.
			if (obj.messages) {
				if (jQuery.sq.internal.cash["locale"] == null) {
					jQuery.get(jQuery.sq.settings.locale_path,
							function(locale) {
								jQuery.sq.locale(locale);
								jQuery.sq.internal.message_set(obj.messages,
										obj.init, locale);
							}, "text");
				} else {
					jQuery.sq.internal.message_set(obj.messages, obj.init,
							jQuery.sq.internal.cash["locale"]);
				}
			} else if (obj.init) {
				obj.init(jQuery.sq.internal.data(),
						jQuery.sq.internal.messages);
			}

		}
	};
	jQuery.sq.internal.messages = {};
	jQuery.sq.message = function(ms) {
		for (var k in ms) {
			jQuery.sq.internal.messages[k] = ms[k];
		}
		jQuery.sq.internal.run_setup.message_cnt--;
		if (jQuery.sq.internal.run_setup.message_cnt <= 0
				&& jQuery.sq.internal.run_setup.callback) {
			try {
				jQuery.sq.internal.run_setup.callback(jQuery.sq.internal
								.data(), jQuery.sq.internal.messages);
			} catch (e) {
				jQuery.sq.log("[SuziQ-2]" + e.toString());
			}
		}
	};
	jQuery.sq.internal.message_read_files = {};

	jQuery.sq.internal.message_set = function(file_names, callback, locale) {
		var arr_tmp = file_names;
		var arr = [];
		if (arr_tmp) {
			for (var i = 0; i < arr_tmp.length; i++) {
				var tmp_name = arr_tmp[i];
				if (!jQuery.sq.internal.message_read_files[tmp_name]) {
					jQuery.sq.internal.message_read_files[tmp_name] = true;
					arr[arr.length] = tmp_name;
				}
			}
		}
		if ((!arr || arr.length == 0) && callback) {
			callback(jQuery.sq.internal.data(), jQuery.sq.internal.messages);
			return;
		}
		var _locale = jQuery.sq.settings.default_locale;
		if (locale != null) {
			_locale = locale;
		} else {
			var __locale = jQuery.sq.locale();
			if (__locale == null) {
				__locale = jQuery.sq.settings.default_locale;
			}
			_locale = __locale;
		}
		_locale = "_" + _locale;
		jQuery.sq.internal.run_setup.message_cnt = arr.length;
		jQuery.sq.internal.run_setup.callback = callback;

		var t = document.body;
		for (var i = 0; i < arr.length; i++) {
			var a = document.createElement('script');
			a.charset = jQuery.sq.settings.message_charset;
			a.type = 'text/javascript';
			var n = arr[i];
			if (n.indexOf(".js") == (n.length - 3)) {
				// no change
			} else {
				n = n + _locale + ".js";
			}
			a.src = n;
			t.appendChild(a);
		}
	};
	jQuery.sq.isLocalMode = function() {
		if (jQuery.sq.production) {
			return false;
		}
		if (jQuery.sq.internal.localflag == null) {
			if (location.toString().indexOf("file") == 0) {
				jQuery.sq.internal.localflag = true;
			} else {
				jQuery.sq.internal.localflag = false;
			}
		}
		return jQuery.sq.internal.localflag;
	};
	jQuery.sq.locale = function(locale) {
		if (locale) {
			jQuery.sq.internal.cash["locale"] = locale;
		}
		var l = jQuery.sq.internal.cash["locale"];
		if (l != null) {
			return l;
		}
		// local
		try {
			l = ((navigator.browserLanguage || navigator.language || navigator.userLanguage)
					.substr(0, 2));
			return l;
		} catch (e) {
		}
		return jQuery.sq.settings.default_locale;
	};
	jQuery.sq.internal.data = function(data) {
		if (data == undefined) {
			return jQuery.sq.internal.data_cash;
		}
		jQuery.sq.internal.data_cash = data;
	};
	jQuery.sq.internal.dummy_data = function(data) {
		if (jQuery.sq.isLocalMode() && jQuery.sq.internal.data_cash == null) {
			jQuery.sq.internal.data_cash = data;
		}
	};
	jQuery.sq.now = function() {
		return new Date().getTime();
	};
	// log
	jQuery.sq.log = function(ss) {
		if (jQuery.sq.production) {
			return;
		}
		var l = "";
		var d = new Date();
		var norm = function(s, size) {
			while (true) {
				if (s.length >= size) {
					return s;
				} else {
					s = ("0" + s);
				}
			}
		};
		var s = d.getFullYear().toString();
		s += "/";
		s += norm((d.getMonth() + 1).toString(), 2);
		s += "/";
		s += norm(d.getDate().toString(), 2);
		s += " ";
		s += norm(d.getHours().toString(), 2);
		s += ":";
		s += norm(d.getMinutes().toString(), 2);
		s += ":";
		s += norm(d.getSeconds().toString(), 2);
		s += ".";
		s += norm(d.getMilliseconds().toString(), 3);

		jQuery.sq.log.internal.logs[jQuery.sq.log.internal.logs.length] = (ss
				+ " @" + s);
	};
	jQuery.sq.log.get = function() {
		if (jQuery.sq.production) {
			return;
		}
		return jQuery.sq.log.internal.logs;
	}
	jQuery.sq.log.clear = function() {
		jQuery.sq.log.internal.logs = [];
	};
	jQuery.sq.log.internal = {};
	jQuery.sq.log.internal.logs = [];

	jQuery.sq.create_message = function(key, args) {
		var s = jQuery.sq.internal.messages[key];
		if (s == undefined) {
			s = key;
		}
	        
	        if (typeof args !== "string") {
		        for (var i = 0; i < args.length; i++) {
			        var ss = "{" + i + "}";
			        s = s.replace(ss, jQuery.sq.create_message(args[i],[]));
		        }
		}
		return s;
	};
	jQuery.sq.val = function(target) {
		var t = target.get(0);
		var tag_name = t.tagName.toLowerCase();
		if (tag_name == "input") {
			if (t.type == 'checkbox') {
				return t.checked ? t.value : null;
			} else if (t.type == 'radio') {
				return t.checked ? t.value : null;
			}
			v = target.attr("value");
		} else if (tag_name == "textarea" || tag_name == "select") {
			v = target.attr("value");
		} else {
			v = target.html();
		}
		if (v == null) {
			return "";
		}
		return v;
	};

	jQuery.sq.cookie = function(name, value, options) {
		if (value === undefined) {
			var arr = document.cookie.split(';');
			for (var i = 0; i < arr.length; i++) {
				var c = jQuery.trim(arr[i]);
				if (c.indexOf(name + '=') == 0) {
					return decodeURIComponent(c.substring(name.length + 1));
				}
			}
			return null;
		}
		options = options || {};
		if (value === null) {
			value = '';
			options.expires = -1;
		}
		var expires = '';
		if (options.expires) {
			if (typeof options.expires == 'number') {
				var date = new Date();
				date.setTime(date.getTime()
						+ (options.expires * 24 * 60 * 60 * 1000));
				expires = '; expires=' + date.toUTCString();
			} else if (options.expires.toUTCString) {
				expires = '; expires=' + options.expires.toUTCString();
			} else {
				jQuery.sq
						.log("[SuziQ-11]jQuery.sq.cookie's options.expires must be a number or a Date Object.");
			}
		}
		var s=name+"=";
		s+= encodeURIComponent(value);
		s+=expires;
		s+=(options.path ? '; path=' + (options.path) : '');
		s+=(options.domain ? '; domain=' + (options.domain) : '');
		s+=(options.secure ? '; secure' : '');
		document.cookie=s;
	};


//Ajax

	jQuery.sq.form2obj = function(fid, validate_flag) {
		var f = jQuery("#" + fid);
		jQuery.sq.event.form_format(f);
		if (validate_flag) {
			var brr = jQuery.sq.event.form_validate(f);
			if (brr && brr.length != 0) {
				for (var i = 0; i < brr.length; i++) {
					if (!brr[i]) {
						return null;
					}
				}
			}
		}
		var param = {};
		jQuery("input,select,textarea", f.get(0)).each(function(i, v) {
					if (v.name) {
						if (!param[v.name]) {
							var vv = jQuery.sq.val(jQuery(v));
							if (vv != null) {
								param[v.name] = vv;
							}
						} else {
							var tmp = param[v.name];
							if (tmp instanceof Array) {
								var vv = jQuery.sq.val(jQuery(v));
								if (vv != null) {
									tmp[tmp.length] = vv;
								}
							} else {
								var vv = jQuery.sq.val(jQuery(v));
								if (vv != null) {
									var tmp_arr = [];
									tmp_arr[tmp_arr.length] = tmp;
									tmp_arr[tmp_arr.length] = vv;
									param[v.name] = tmp_arr;
								}
							}
						}
					}
				});
		return param;
	};

	jQuery.sq.ajax = function(option) {
		var fid = option['form_id'];
		var callback = option['callback'];
		var data = option['data'];
		var dummy_access = option['mock'];

		option['dataType'] = option['dataType']
				|| jQuery.sq.settings.ajax_dataType;
		option['error'] = option['error'] || jQuery.sq.ajax.error;

		var parse = option['parse'] || jQuery.sq.ajax.parse;
		var encode = option['encode'] || jQuery.sq.ajax.encode;
		var pre_proc = option['pre_proc'] || jQuery.sq.ajax.pre_proc;
		var ajax = option['ajax'] || jQuery.sq.ajax.request;
		var form2obj = option['form2obj'] || jQuery.sq.form2obj;
		
		var d = null;
		if (fid) {
			d = form2obj(fid, true);
			if (d === null) {
				return false;
			}
		}
		if (data) {
			if (d != null) {
				for (var k in data) {
					d[k] = data[k];
				}
			} else {
				d = data;
			}
		} else if (d === null) {
			d = {};
		}
		if (option['before']) {
			if (option['before'](d) === false) {
				return false;
			}
		}
		if (callback && option['success']) {
			jQuery.sq
					.log("Avoid defining success and callback in jQuery.sq.ajax!");
		}
		if (jQuery.sq.isLocalMode()) {
			var da=dummy_access || jQuery.sq.ajax.mock[option['url']];
			if (da) {
				var res = da(d);
				if (option['success']) {
					option['success'](res, {}, {});
				} else if (callback) {
					jQuery.sq.ajax.request_data=d;
					jQuery.sq.ajax.response_data=res;
					callback(res, d);
				}
			} else {
				jQuery.sq.log("[SuziQ-6] Please define mock function.");
				if (option['success']) {
					option['success'](res, {}, {});
				} else if (callback) {
					jQuery.sq.ajax.request_data=d;
					jQuery.sq.ajax.response_data=null;
					callback(null, d);
				}
			}
			return false;
		}

		if(jQuery.sq.settings.context_root_on && option['context_root_off'] !== true && option['context_root_done'] !== true && option['url'].indexOf("/")==0){
			if(!jQuery.sq.settings.context_root){
				jQuery.sq.settings.context_root=location.pathname.split("/")[1];
			}
			option['url'] = "/"+jQuery.sq.settings.context_root+option['url'];
			option['context_root_done']=true;
		}
		
		option['data'] = encode(d);
		option['success'] = option['success']
				|| function(text, textStatus, xhr) {
					var stop_flag = pre_proc(text, textStatus, xhr);
					if (!stop_flag) {
						return false;
					}
					var data = parse(text);
					jQuery.sq.ajax.request_data=d;
					jQuery.sq.ajax.response_data=data;
					callback(data, d);
					return false;
				};
		ajax(option);
		return false;
	};

	jQuery.sq.ajax.request_data=null;
	jQuery.sq.ajax.response_data=null;
	
	jQuery.sq.ajax.mock={};
	
	jQuery.sq.ajax.original_ajax = jQuery.ajax;
	jQuery.ajax = jQuery.sq.ajax;
	jQuery.sq.ajax.request = function(option) {
		jQuery.sq.ajax.original_ajax(option);
	};

	jQuery.sq.event.noConflictWithJQuery(function() {
				if (jQuery.sq.ajax.original_ajax) {
					jQuery.ajax = jQuery.sq.ajax.original_ajax;
				}
			}, "noConflictWithJQuery_ajax");

	jQuery.sq.ajax.to = function(url, data, tag) {
		if (!tag || tag.length == 0) {
			tag = "body";
		}
		jQuery.sq.internal.data(data);
		if (jQuery.sq.isLocalMode()) {
			if (url.indexOf("/") == 0) {
				jQuery.sq
						.log("[SuziQ-8] Please define a relative url. Your url is "
								+ url + ".");
				return false;
			}
			var arr = location.pathname.split("/");
			var s = "";
			for (var i = 0; i < arr.length - 1; i++) {
				s += arr[i];
				s += "/";
			}
			url = "file://" + s + url;
			jQuery.sq.run_setup.lock = false;
			var framename = "_sq_local_iframe" + jQuery.sq.now();
			jQuery('body')
					.append('<iframe src="'
							+ url
							+ '" name="'
							+ framename
							+ '" id="'
							+ framename
							+ '" height=0 width=0 onload="jQuery.sq.ajax.internal.local_iframe_proc(\''
							+ tag + '\',\'' + framename + '\');"></iframe>');

			return false;
		}
		jQuery.ajax({
					type : "GET",
					url : url,
					success : function(data, textStatus, xhr) {
						var s = jQuery.sq.ajax.internal.getBodyHTML(data);
						var oo = jQuery(tag);
						if (oo.get(0) == null) {
							jQuery.sq.log("[SuziQ-9]We cannot find tag [" + tag
									+ "]");
						}
						oo.html(s);
					},
					error : function(XMLHttpRequest, textStatus, errorThrown) {
						jQuery.sq.log("[SuziQ-5]" + textStatus + ", "
								+ errorThrown);
					}
				});
	};

	jQuery.sq.ajax.error = function(XMLHttpRequest, textStatus, errorThrown) {
		jQuery.sq.log("[SuziQ-4]" + textStatus + ", " + errorThrown);
	};

	jQuery.sq.ajax.internal = new Object();
	jQuery.sq.ajax.internal.context_root=null;
	jQuery.sq.ajax.internal.local_iframe_proc = function(tag, framename) {
		var s = "";
		try {
			// s=window._sq_local_iframe.window.document.body.innerHTML;
			s = window[framename].window.document.body.innerHTML;
			if (s == null || s.length == 0) {
				jQuery.sq.log("[SuziQ-7]No contents in next page.");
				return;
			}
			s += "<script type='text/javascript' >jQuery.sq.run_setup.lock=false;jQuery(jQuery.sq.run_setup);</script>";
			jQuery("#" + framename).remove();
		} catch (e) {
			jQuery.sq.log("[SuziQ-3]" + e.toString());
			throw e;
		}
		var oo = jQuery(tag);
		if (oo.get(0) == null) {
			jQuery.sq.log("[SuziQ-9]We cannot find tag [" + tag + "]");
		}
		oo.html(s);
	};
	jQuery.sq.ajax.internal.getBodyHTML = function(text) {
		var i = text.indexOf("<body>");
		var leng = 6;
		if (i == -1) {
			i = text.indexOf("<body ");
			if (i != -1) {
				i = text.indexOf(">", i);
				leng = 1;
			}
		}
		if (i == -1) {
			i = text.indexOf("<BODY>");
			leng = 6;
		}
		if (i == -1) {
			i = text.indexOf("<BODY ");
			if (i != -1) {
				i = text.indexOf(">", i);
				leng = 1;
			}
		}
		var j = text.lastIndexOf("</body>");
		if (j == -1) {
			j = text.lastIndexOf("</BODY>");
		}
		var s = text.substring(i + leng, j);
		s += "<script type='text/javascript' >jQuery.sq.run_setup.lock=false;jQuery(jQuery.sq.run_setup);</script>";
		return s;
	};

	jQuery.sq.ajax.parse = function(text) {
		var data = null;
		text = "data=" + text;
		try {
			eval(text);
		} catch (e) {
			jQuery.sq.log("[SuziQ-10]" + e.toString());
		}
		return data;
	};

	jQuery.sq.ajax.encode = function(data) {
		return jQuery.toJSON(data);
	};
	// user setting ajax
	jQuery.sq.ajax.request_setting = function(option, target_btn) {
		target_btn.click(function() {
					jQuery.sq.ajax(option);
					return false;
				});
	};
	jQuery.sq.ajax.no_request_setting = function(option, target_btn) {
		target_btn.click(function() {
					var fid = option['form_id'];
					var d = {};
					if (fid) {
						d = option["form2obj"](fid, true);
						if (d == null)
							return false;
					}
					option["callback"](d);
					return false;
				});
	};

	jQuery.fn.sq_norequest = function(option) {
		return this.each(function() {
					var t = jQuery(this);
					option['form_id'] = option['form_id']
							|| jQuery.sq.ajax.internal.fid(t);
					option['form2obj'] = option['form2obj']
							|| jQuery.sq.form2obj;

					jQuery.sq.ajax.no_request_setting(option, t);
				});
	};

	jQuery.fn.sq_post = function(option) {
		return this.each(function() {
					var t = jQuery(this);
					option['type'] = "POST";
					option['btn'] = this.id;
					if (!option['form_id']) {
						option['form_id'] = jQuery.sq.ajax.internal.fid(t);
					}
					jQuery.sq.ajax.request_setting(option, t);
				});
	};
	jQuery.fn.sq_get = function(option) {
		return this.each(function() {
					var t = jQuery(this);
					option['type'] = "GET";
					option['btn'] = this.id;
					if (!option['form_id']) {
						option['form_id'] = jQuery.sq.ajax.internal.fid(t);
					}
					jQuery.sq.ajax.request_setting(option, t);
				});
	};
	jQuery.fn.sq_put = function(option) {
		return this.each(function() {
					var t = jQuery(this);
					option['type'] = "PUT";
					option['btn'] = this.id;
					if (!option['form_id']) {
						option['form_id'] = jQuery.sq.ajax.internal.fid(t);
					}
					jQuery.sq.ajax.request_setting(option, t);
				});
	};
	jQuery.fn.sq_delete = function(option) {
		return this.each(function() {
					var t = jQuery(this);
					option['type'] = "DELETE";
					option['btn'] = this.id;
					if (!option['form_id']) {
						option['form_id'] = jQuery.sq.ajax.internal.fid(t);
					}
					jQuery.sq.ajax.request_setting(option, t);
				});
	};

	jQuery.sq.ajax.internal.fid = function(t) {
		if (t.get(0) && t.get(0).form) {
			return t.get(0).form.id;
		}
		return null;
	};
	jQuery.sq.ajax.pre_proc = function(data, textStatus, xhr) {
		return true;
	};



	jQuery.fn.fill = function(data, selector_fnc) {
		if (!selector_fnc) {
			selector_fnc = function(k, t) {
				return t.selector + "[name=" + k + "]";
			}
		}
		for (var k in data) {
			var d = data[k];
			if (d instanceof Array) {
				continue;
			}
			jQuery(selector_fnc(k, this)).each(function() {
						var tt = jQuery(this);
						var tag_name = tt.get(0).tagName.toLowerCase();
						if (tag_name == "input") {
							if (tt.attr("type") == "checkbox") {
								tt.attr("checked", "checked");
							} else if (tt.attr("type") == "radio") {
								if (tt.val() == d) {
									tt.attr("checked", "checked");
								}
							} else {
								tt.val(d);
							}
						} else {
							tt.html(d);
						}
					});
		}
	};



})(jQuery);
jQuery(jQuery.sq.run_setup);
