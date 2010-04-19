function Yam(jsonYam) {
	this._init(jsonYam)
}

Yam.prototype._init = function(jsonYam) {
	for(var property in jsonYam) {
		this[property] = jsonYam[property];
	}
}

Yam.prototype.asElement = function() {
	var element = $('<div>')
			.addClass("yam")
			.attr("id", this.id)
			.append('<p>')
				.text(this.body.parsed); 
	
	return this.replied_to_id ? $('<div>').addClass('reply-arrow').text('-->').after(element) : element;
}

function Thread() {
	this.YAMS = new Array();
	
}

Thread.prototype.init = function() {
	
}

Thread.prototype.addYam = function(yam) {
	this.YAMS.push(yam);
}

Thread.prototype.getYams = function() {
	if(!this._hasFirstYam()) {
		chrome.extension.sendRequest({action: "fetchThread", function())
	}
	
}

Thread.prototype._hasFirstYam() {
	for(var key in this.YAMS) {
		var yam = this.YAMS[key];
		if(!yam.replied_to_id) return true;
	}
	return false;
}

function Yams(yams) {
	this.YAMS = new Array();
	this._init(yams)
}

Yams.prototype._init = function(yams) {
	for(var i=0; i<yams.length; i++) {
		var yam = new Yam(yams[i]);
		
		if(!yam.replied_to_id || ( yam.replied_to_id && containsFirstYam(yams, yam))) {
			this.YAMS.push((new Yam(yams[i])));
		} else {
			chrome.extension.sendRequest({action: "storeOrphanYam", yam: new Yam(yams[i])});
		}
	}
	
	chrome.extension.sendRequest({action: "storeLastYamId", yamId: this.YAMS[this.YAMS.length - 1].id})
	
	this.YAMS = this.YAMS.sort(this._yamComparator);
}

Yams.prototype._yamComparator = function(a, b) {
	if(a.thread_id == b.thread_id) {
		return (new Date(a.created_at) < new Date(b.created_at)) ? -1 : 1;
	} else {
		return (new Date(a.created_at) < new Date(b.created_at)) ? 1 : -1;
	}
}

Yams.prototype.getYams = function() {
	return this.YAMS;
}