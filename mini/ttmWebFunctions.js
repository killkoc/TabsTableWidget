
function ttmGetLocalStorage(key) {
	if (typeof(Storage) !== 'undefined') {
		return(localStorage.getItem(key));
	}
	return('undefined');
}

function ttmSetLocalStorage(key, value) {
	if (typeof(Storage) !== 'undefined') {
		localStorage.setItem(key, value);
	}
}

function ttmSwitchToGym(gym) {
	// switch to correct gym
	if (gym !== undefined && gym !== null) {
		location.pathname = '/' + gym + location.pathname;
	}
}

function ttmSetGymLocation() {
	var gymLocation = location.pathname.split('/')[1];

	if (gymLocation.length !== 2) {
		gymLocation = ttmGetLocalStorage('totem');
	}
	else {
		ttmSetLocalStorage('totem', gymLocation);
	}
	return(gymLocation);
}

function ttmSwitchToLanguage(language) {
	// switch to correct language
	if (language !== undefined && language !== null) {
		location.pathname = '/' + language + location.pathname;
	}
}

function ttmSetLanguage(key) {
	var language = location.pathname.split('/')[1];

	if (language.length !== 2) {
		language = ttmGetLocalStorage(key);
	}
	else {
		ttmSetLocalStorage(key, language);
	}
	return(language);
}

function ttmAddGymButtonsEventListener() {
	document.querySelectorAll('.gymButton').forEach(button => {
    	button.addEventListener('click', function(event) {
        	ttmGymButtonClicked(event); // Pass the URL to the function
    	});
	});
}

function ttmGymButtonClicked(event) {
	const pathArray = location.pathname.split('/');
	const targetSite = event.currentTarget.href;

	if (pathArray.length > 2) {
		event.currentTarget.href = targetSite + '/' + pathArray[2];
	} else if (pathArray.length == 2 && pathArray[1].length > 2) {
		event.currentTarget.href = targetSite + '/' + pathArray[1];
	}
}

var totemLocation = 'undefined';
