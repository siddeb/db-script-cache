window.script_data = {};
 
function ScriptCache(){
	var thiz = this;
	thiz.db = window.openDatabase ? openDatabase('scriptCache', '1.0', 'Javascript cache', 1000000) : null;
	thiz.db2 = window.openDatabase ? openDatabase('cssCache', '1.0', 'CSS cache', 100000) : null;
 
	var nullDataHandler = function(transaction, error){ /*console.log(error);*/ return true; };
	var errorHandler    = function(transaction, error){ /*console.log(error.message);*/ return true; };
 
	// create tables in DB for first run. 
	if (thiz.db) thiz.db.transaction(function(transaction){
		transaction.executeSql('CREATE TABLE scripts(id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE, version TEXT NOT NULL, code TEXT NOT NULL);', [], nullDataHandler, errorHandler);
	});
 
	if (thiz.db2) thiz.db2.transaction(function(transaction){
		transaction.executeSql('CREATE TABLE styles(id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE, version TEXT NOT NULL, code TEXT NOT NULL);', [], nullDataHandler, errorHandler);
	});
 
	var create_script_elem = function(src, callback){
		var script = document.createElement("script");
		    script.type = "text/javascript";
 
		if (callback){
			if (script.readyState){
	      script.onreadystatechange = function(){
	        if (script.readyState == "loaded" || script.readyState == "complete"){
	          script.onreadystatechange = null;
	          callback();
	        }
	      };
	    }	else
	      script.onload = callback;
		}
 
    script.src = src;
    document.getElementsByTagName("head")[0].appendChild(script);
	};
 
	var store_in_cache = function(script_name, version, code){
		if (thiz.db) thiz.db.transaction(function(transaction){
			transaction.executeSql('insert into scripts (name, version, code) VALUES (?,?,?);', [script_name, version, code], nullDataHandler, errorHandler);
		})
	};
 
	var execute_code = function(code){
		eval.call(window, code);
	};
 
	// xhrs the code and stores it in the DB
	var get_and_store = function(script_name, version, callback){
		var req = new XMLHttpRequest();  
		req.open('GET', script_name, false);   
		req.send(null);  
		if(req.status == 200)
			var the_codes = req.responseText;
 
		if (callback) callback(the_codes);
		store_in_cache(script_name, version, the_codes);
	};
 
	var clear_versions = function(script_name){
		if (thiz.db) thiz.db.transaction(function(transaction){
			transaction.executeSql('delete from scripts where name=?;', [script_name], nullDataHandler, errorHandler)
		})
	};
 
	thiz.the_codes = [];
	thiz.completed = 0;
 
	var include_script = function(script_name, version, index, total){		
		if (!thiz.db)			
			create_script_elem(script_name); // if the browser doesn't support openDatabase just inject the script elem
		else {
			thiz.db.transaction(function(transaction){
				transaction.executeSql('select code from scripts where name=? and version=?;', [script_name, version], function(transaction, data){
					if (data.rows.length > 0 && data.rows.item(0).code && data.rows.item(0).code !== 'undefined'){
						thiz.the_codes[index] = data.rows.item(0).code;
						thiz.completed += 1;
						if (thiz.completed === total) execute_code(thiz.the_codes.join(''));
					} else {
						clear_versions(script_name); // remove old versions if requested version not found
						get_and_store(script_name, version, function(c){
							thiz.the_codes[index] = c;
							thiz.completed += 1;
							if (thiz.completed === total) execute_code(thiz.the_codes.join('')); // join all the scripts together and eval (for propper scoping)
						})
					}												
				}, errorHandler);
			});
		}
		return thiz;
	};
 
	var create_link_elem = function(href, callback){
		var link = document.createElement("link");
		    link.type = "text/css";
		    link.rel = "stylesheet";
				link.media = "screen";
 
		if (callback){
			if (link.readyState){
	      link.onreadystatechange = function(){
	        if (link.readyState == "loaded" || link.readyState == "complete"){
	          link.onreadystatechange = null;
	          callback();
	        }
	      };
	    }	else
	      link.onload = callback;
		}
 
    link.href = href;
    document.getElementsByTagName("head")[0].appendChild(link);
	};
 
	var store_in_cache_css = function(href_name, version, code){
		if (thiz.db2) thiz.db2.transaction(function(transaction){
			transaction.executeSql('insert into styles (name, version, code) VALUES (?,?,?);', [href_name, version, code], nullDataHandler, errorHandler);
		})
	};
 
	// xhrs the css and stores it in the DB
	var get_and_store_css = function(href_name, version, callback){				
		var req = new XMLHttpRequest();  
		req.open('GET', href_name, false);   
		req.send(null);  
		if(req.status == 200)
			var the_styles = req.responseText;
 
		if (callback) callback(the_styles);
		store_in_cache_css(href_name, version, the_styles);
	};
 
	var clear_versions_css = function(href_name){
		if (thiz.db2) thiz.db2.transaction(function(transaction){
			transaction.executeSql('delete from styles where name=?;', [href_name], nullDataHandler, errorHandler)
		})
	};
 
	thiz.the_styles = [];
	thiz.completed2 = 0;
 
	var include_href = function(href_name, version, index, total){		
		if (!thiz.db2)			
			create_link_elem(href_name); // if the browser doesn't support openDatabase just inject the link elem
		else {
			thiz.db2.transaction(function(transaction){
				transaction.executeSql('select code from styles where name=? and version=?;', [href_name, version], function(transaction, data){
					if (data.rows.length > 0 && data.rows.item(0).code && data.rows.item(0).code !== 'undefined'){
						thiz.the_styles[index] = data.rows.item(0).code;
						thiz.completed2 += 1;
						if (thiz.completed2 === total) insert_style(thiz.the_styles.join(''));
					} else {
						clear_versions_css(href_name); // remove old versions if requested version not found
						get_and_store_css(href_name, version, function(c){
							thiz.the_styles[index] = c;
							thiz.completed2 += 1;
							if (thiz.completed2 === total) insert_style(thiz.the_styles.join('')); // join all the styles together and inject
						})
					}												
				}, errorHandler);
			});
		}
		return thiz;
	};
 
	var insert_style = function(code){
		var style = document.createElement("style");
		    style.type = "text/css";
		    style.media = "screen";
				style.innerText = code;
    document.getElementsByTagName("head")[0].appendChild(style);
	};

	return {
		// include multiple scripts
		includes: function(scripts, parallel){
			if (window.openDatabase || parallel)
				for (var i=0; i<scripts.length; i++)
					include_script(scripts[i][0], scripts[i][1], i, scripts.length);
			else {
				var i = 0;
				var load_next = function(){ if (i+1 < scripts.length) create_script_elem(scripts[++i][0], load_next); };
				create_script_elem(scripts[i][0], load_next)
			}
		},
		// include just one script
		include: function(script_name, version){
			include_script(script_name, version, 0, 1);
		},
		// removes the supplied script from the cache.
		clear_from_cache: function(script_name){
			thiz.db.transaction(function(transaction){
				transaction.executeSql('DELETE FROM scripts WHERE name=?;', [script_name], nullDataHandler, errorHandler);
			});
			return thiz;
		},
		// include multiple css files
		include_css: function(hrefs, parallel){
			if (window.openDatabase || parallel)
				for (var i=0; i<hrefs.length; i++)
					include_href(hrefs[i][0], hrefs[i][1], i, hrefs.length);
			else {
				var i = 0;
				var load_next = function(){ if (i+1 < hrefs.length) create_link_elem(hrefs[++i][0], load_next); };
				create_link_elem(scripts[i][0], load_next)
			}
		}
	}	
}
 
// run the code, if any inside of the script tag that included this script. 
var scripts = document.getElementsByTagName("script");
eval.call(window, scripts[scripts.length - 1].innerHTML); 
