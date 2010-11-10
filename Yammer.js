function Yammer() {
	this.authentication = new Authentication();
}

Yammer.prototype.getMessages = function(callback, options) {
	var url = 'https://www.yammer.com/api/v1/messages.json';
	
	if(options.olderThan) url += '?older_than=' + options.olderThan
	if(options.newerThan) url += '?newer_than=' + options.newerThan
	
	var instance = this;
	this.authentication.call(url, 'GET', null, null, 
		function(data) {
			var yams = JSON.parse(data).messages
			if (!options.olderThan) {
				instance._storeNewestYamId(yams);
			}
			yams = instance._filterSkippableYams(yams);
			callback(yams);
	});
}

Yammer.prototype.getThread = function(callback, threadId) {
	var url = 'https://www.yammer.com/api/v1/messages/in_thread/' + threadId + '.json';
		
	var instance = this;
	this.authentication.callSync(url, 'GET', null, null, 
		function(data) {
			var yams = JSON.parse(data).messages;
			instance._storeSkippableYamIds(yams)
			callback(yams);
	});
}

Yammer.prototype.getUserInfo = function(callback, userId) {
	var url = 'https://www.yammer.com/api/v1/users/' + userId + '.json';
	
	var user = this._fetchUser(userId);
	if(user) {
		callback(user);
		return;
	}
	
	var instance = this;
	this.authentication.callSync(url, 'GET', null, null, 
			function(data) {
				var userInfo = JSON.parse(data);
				instance._storeUser(userInfo);
				callback(userInfo);
			});
}


Yammer.prototype._fetchUser = function(userId) {
	var users = JSON.parse(localStorage.getItem("usersCache"));
	if(users && users[userId]) {
		return JSON.parse(users[userId]);
	}
}

Yammer.prototype._storeUser = function(userInfo) {
	var users = JSON.parse(localStorage.getItem("usersCache"));
	
	if(!users) users = {};
	
	users[userInfo.id] = JSON.stringify(userInfo);
	localStorage.setItem("usersCache", JSON.stringify(users));
}

Yammer.prototype._filterSkippableYams = function(yams) {
	var skippable = JSON.parse(localStorage.getItem("alreadyFetchedYamIds"));
	if(skippable) {
		for(var i=0 ; i<yams.length ; i++) {
			if(contains(skippable, yams[i].id)) {
				yams.splice(i, 1);
				i--;
			}
		}
	}
	return yams;
}

Yammer.prototype._storeSkippableYamIds = function(yams) {
	var alreadyFetched = JSON.parse(localStorage.getItem("alreadyFetchedYamIds"));
	if(!alreadyFetched) {
		alreadyFetched = new Array();
	} 

	for(var i=0 ; i<yams.length ; i++) {
		alreadyFetched.push(yams[i].id);
	}
	localStorage.setItem("alreadyFetchedYamIds", JSON.stringify(alreadyFetched));
}

Yammer.prototype._storeNewestYamId = function(yams) {
	if(yams.length > 0) {
		localStorage.setItem("newestYamId", yams[0].id);
	}
}

Yammer.prototype.getNewestYamId = function() {
	return localStorage.getItem("newestYamId");
}