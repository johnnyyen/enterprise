function Yam(jsonYam) {
	this._init(jsonYam)
	this._fetchUser();
}

Yam.prototype._fetchUser = function() {
	var instance = this;
	new Yammer().getUserInfo(function(data) {
		instance.sender = data;
	}, this.sender_id);
}

Yam.prototype._init = function(jsonYam) {
	for(var property in jsonYam) {
		this[property] = jsonYam[property];
	}
}

Yam.prototype.asElement = function(canAddReplyArrow) {
	var isReply = canAddReplyArrow && this.replied_to_id;
	var element = $('<div>').addClass("yam").attr("id", this.id);
	var pic = $('<img>').addClass("userPic").attr("src", this.sender.mugshot_url);
	
	var header = $('<div>').addClass("yamHeader").text("by ");
	var senderName = $('<span>').addClass("senderName").text(this.sender.full_name);
	var sendTime = $('<span>').addClass("sendTime").text(this.getCreatedTime());
	header.append(senderName).append(sendTime);
	
	var body = this.getBody();
	
	if(isReply) {
		element.addClass("reply");
	}
	
	element.append(pic).append(header).append(body);
	
	if(this.liked_by.count > 0) { 
		var liked = "Liked by ";
		for(var i=0; i<this.liked_by.names.length; i++) {
			var likedBy = this.liked_by.names[i].full_name;
			liked += (i>0 ? ", " : "") +  likedBy;
		}
		element.append($('<div>').addClass("yamFooter").text(liked));
	}
			
	if(!isReply) {
		element.append($("<div>").addClass("yamBottom"));
	}
	
	return element;
}

Yam.prototype.getBody = function() {
	var bodyElement = $('<span>').addClass("yamBody");
	var body = this.body.plain;
	
	var urls = this.body.urls;
	if(urls) {
		for(var i in urls) {
			var index = body.indexOf(urls[i]);
			bodyElement.append(body.substr(0, index));
			body = body.slice(index + urls[i].length);
			bodyElement.append(this._createAnchor(urls[i]));
		}		
	}
	return bodyElement.append(body);
}

Yam.prototype._createAnchor = function(url) {
	var instance = this;
	return  $('<a>').addClass("url")
		.attr("href", url)
		.text(url.substr(0, 37) + (url.length > 37 ? "..." : ""))
		.attr("title", url)
		.click(function() {
			chrome.tabs.create({"url": url, selected: false});
		});
}

Yam.prototype.getCreatedTime = function() {
	var date = new Date(this.created_at);
	return " @" + date.toLocaleTimeString() + " on " + date.toLocaleDateString();
}


function Thread(yam) {
	this.YAMS = new Array();
	this.THREAD_ID = yam.thread_id;
	this._init(yam);
}

Thread.prototype._init = function(yam) {
	this.addYam(yam);
}

Thread.prototype.addYam = function(yam) {
	this.YAMS.push(yam);
}

Thread.prototype.getYams = function() {
	return this.YAMS;
}

Thread.prototype.clearYams = function() {
	this.YAMS = new Array();
}

//Fetches the full Thread if the thread isn't complete and sorts the thread
Thread.prototype.finalize = function() {
	if(!this._hasFirstYam()) {
		var instance = this;
		new Yammer().getThread(function(data) {
			instance.clearYams();
			for(var i=0 ; i<data.length ; i++) {
				var yam = new Yam(data[i]);
				instance.addYam(yam);
				chrome.extension.sendRequest({action: "storeAlreadyFetchedYamId", yamId: yam.id});
			}
		}, this.getThreadId())
	}
	this.YAMS.sort(this._yamComparator);
}

Thread.prototype.getThreadId = function() {
	return this.THREAD_ID;
}

Thread.prototype.getThreadDate = function() {
	var lastBiggestDate = null;
	for(var i=0 ; i<this.YAMS.length ; i++) {
		var yamDate = new Date(this.YAMS[i].created_at);
		if(!lastBiggestDate || lastBiggestDate && lastBiggestDate < yamDate) {
			lastBiggestDate = yamDate;
		}
	}
	return lastBiggestDate;
}

Thread.prototype.asElement = function() {
	var element = $('<div>').addClass('thread').attr('id', this.THREAD_ID);
	for(var i=0 ; i<this.YAMS.length ; i++) {
		var yam = this.YAMS[i];
		element.append(yam.asElement( i == 0 ? false : true ));
	}
	return element;
}

Thread.prototype._hasFirstYam = function() {
	for(var key in this.YAMS) {
		var yam = this.YAMS[key];
		if(!yam.replied_to_id) return true;
	}
	return false;
}

Thread.prototype._yamComparator = function(a, b) {
	return (new Date(a.created_at) < new Date(b.created_at)) ? -1 : 1;
}



function Threads(yamsListJSON) {
	this.THREADS = new Array();
	this._init(yamsListJSON);
}

Threads.prototype._init = function(yams) {
	for(var i=0; i<yams.length; i++) {
		var yam = new Yam(yams[i]);
		
		var thread = contains(this.THREADS, yam, function(a, b){return a.getThreadId() == b.thread_id});
		if(thread) {
			thread.addYam(yam);
		} else {
			this.THREADS.push(new Thread(yam));
		}
	}
	
	chrome.extension.sendRequest({action: "storeLastYamId", yamId: yam.id})
	
	for(var i=0 ; i<this.THREADS.length ; i++) {
		var thread = this.THREADS[i];
		thread.finalize();
	}
	
	this.THREADS.sort(this._threadComparator);
}

Threads.prototype.getThreads = function() {
	return this.THREADS;
}

Threads.prototype._threadComparator = function(a, b) {
	return (a.getThreadDate() > b.getThreadDate()) ? -1 : 1;
}