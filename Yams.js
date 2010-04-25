function Yam(jsonYam) {
	this._init(jsonYam)
}

Yam.prototype._init = function(jsonYam) {
	for(var property in jsonYam) {
		this[property] = jsonYam[property];
	}
}

Yam.prototype.asElement = function(canAddReplyArrow) {
	var isReply = canAddReplyArrow && this.replied_to_id;
	var element = $('<div>').addClass("yam").attr("id", this.id);
	var body = $('<span>').addClass("yamBody").text(this.body.parsed);
	
	if(isReply) {
		element.addClass("reply");
		//element.append($('<div>').addClass('reply-arrow').text("ss"));
	}
	
	element.append(body);
	
	if(!isReply) {
		element.append($("<div>").addClass("yamBottom"));
	}
	
	return element;
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
		new Authentication().getThread(function(data) {
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