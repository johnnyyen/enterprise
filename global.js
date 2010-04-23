function containsFirstYam(haystack, yam) {
	for(var item in haystack) {
		var element = haystack[item]
        if(element.id == yam.replied_to_id && element.replied_to_id) {
			return containsFirstYam(haystack, element);
		} else if(element.id == yam.replied_to_id && !element.replied_to_id) {
			return true;
		}
	}
	return false;
}

function contains(haystack, element, comparator) {
	for(var i=0 ; i<haystack.length ; i++) {
		var item = haystack[i];
		if(comparator && comparator(item, element)) {
			return item;
		} else if(!comparator && item == element){
			return item;
		}
	}
	return null;
}