function Authentication() {
	this.CONSUMER_KEY = "Yocs3IGzpE1wOLmj6cIAhQ";
	this.CONSUMER_SECRET = "66Ty5h2YQ2EHH1WkuWMprR6S2ZvHXoMAX8cbejBHU";
		
	this.OAUTH_TOKEN = "";
	this.OAUTH_TOKEN_SECRET = "";
	this.OAUTH_VERIFIER = "";
	this._init();
}

Authentication.prototype.getMessages = function(callback, olderThan) {
	var url = 'https://www.yammer.com/api/v1/messages.json?threaded=true';
	
	if(olderThan) url += '&older_than=' + olderThan
	
	this._call(url, 'GET', 
		this._oauth_headers(localStorage.getItem("OAUTH_TOKEN"), localStorage.getItem("OAUTH_TOKEN_SECRET"), null), 
		function() {}, 
		function(data) {
			callback(data);
	});
}

Authentication.prototype._init = function() {
	if(!localStorage.getItem("OAUTH_TOKEN")) {
		var instance = this;
		this._call('https://www.yammer.com/oauth/request_token', 'POST', this._oauth_headers(null, null, null),
			function() {
				chrome.tabs.create({"url": "https://www.yammer.com/oauth/authorize?oauth_token=" + instance.OAUTH_TOKEN});
				chrome.tabs.onUpdated.addListener( function(tabId, changeInfo, tab){instance._getCode(tabId, changeInfo, tab)} );
			}, 
			function(data) {
				var parameters = data.split("&");
				for( var i=0; i < parameters.length; i++) {
					var param = parameters[i].split("=");
					if(param[0] == "oauth_token") {
						instance.OAUTH_TOKEN = param[1];
					} else if (param[0] == "oauth_token_secret") {
						instance.OAUTH_TOKEN_SECRET = param[1];
					}
			  	}
			}
		)
	}
}

Authentication.prototype._getCode = function(tabId, changeInfo, tab) {
	if (changeInfo.status == "loading" && tab.url.indexOf("oauth_verifier") != -1) {
		var params = tab.url.split("?")[1].split("&");
		for (var i = 0; i < params.length; i++) {
			var param = params[i].split("=")
			if (param[0] == "oauth_verifier") {
				this.OAUTH_VERIFIER = param[1];
			}
		}
		
		chrome.tabs.remove(tabId)
		
		var instance = this;
		this._call('https://www.yammer.com/oauth/access_token', 'POST', 
			this._oauth_headers(this.OAUTH_TOKEN, this.OAUTH_TOKEN_SECRET, this.OAUTH_VERIFIER),
			function() {},
			function(data) {
				var parameters = data.split("&");
				for (var i = 0; i < parameters.length; i++) {
					var param = parameters[i].split("=");
					if (param[0] == "oauth_token") {
						localStorage.setItem("OAUTH_TOKEN", param[1]);
					}
					else if (param[0] == "oauth_token_secret") {
						localStorage.setItem("OAUTH_TOKEN_SECRET", param[1]);
					}
				}
			}
		)
	}
}

Authentication.prototype._call = function(url, method, headers, onSuccess, parseData, onError) {
	var xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function(data) {
		if (xhr.readyState == 4) {
		    if (xhr.status == 200) {
		      	if(parseData) parseData(xhr.responseText);			      
				if(onSuccess) onSuccess();
		    } else {
				if(onError) onError(xhr);
			}
		 }
	}
	xhr.open(method, url, true);
	xhr.setRequestHeader('Authorization', headers);
	xhr.send();
}

Authentication.prototype._oauth_headers = function(token, token_secret, verifier) {
	var buff = new Array();
    buff.push("OAuth realm=\"");
    buff.push("\", oauth_consumer_key=\"");
    buff.push(this.CONSUMER_KEY);
    buff.push("\", ");

    if (token != null) {
      buff.push("oauth_token=\"");
      buff.push(token);
      buff.push("\", ");
    }
    
    buff.push("oauth_signature_method=\"");
    buff.push("PLAINTEXT");
    buff.push("\", oauth_signature=\"");
    buff.push(this.CONSUMER_SECRET);
    buff.push("%26");
    if (token_secret != null) {
      buff.push(token_secret);
    }
	
	var date = new Date();
	
    buff.push("\", oauth_timestamp=\"");
    buff.push(date);
    buff.push("\", oauth_nonce=\"");
    buff.push(date);

    if (verifier != null) {
      buff.push("\", ");
      buff.push("oauth_verifier=\"");
      buff.push(verifier);
    }

    buff.push("\", oauth_version=\"1.0\"");

    return buff.join("");
}	