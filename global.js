function contains(haystack, matcher) {
	for(var item in haystack) {
		if(matcher(haystack[item])) {
			return true;
		}
	}
	return false;
}