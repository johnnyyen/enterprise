function Yam(jsonYam) {
	this._init(jsonYam)
}

Yam.prototype._init = function(jsonYam) {
	for(var property in jsonYam) {
		this[property] = jsonYam[property];
	}
}

Yam.prototype.asElement = function() {
	var element = this.replied_to_id ? $('<div>').addClass('reply-arrow').text('-->').append('<div>') : $('<div>'); 
	
	return element.before($('<div>')
			.addClass("yam")
			.attr("id", this.id)
			.append('<p>')
				.text(this.body.parsed));
}

function Yams(yams) {
	this.YAMS = new Array();
	this._init(yams)
}

Yams.prototype._init = function(yams) {
	for(var i=0; i<yams.length; i++) {
		var yam = new Yam(yams[i]);
		if(!yam.replied_to_id || ( yam.replied_to_id && contains(yams, function(element) {
			return element.id == yam.replied_to_id ? true : false;  
		}))) {
			this.YAMS.push((new Yam(yams[i])));
		}
	}
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