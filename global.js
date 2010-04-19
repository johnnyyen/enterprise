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