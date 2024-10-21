
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
    debugger;
    // Check if language is valid (undefined, null, or more than 2 chars should do nothing)
    if (language === undefined || language === null || language.length > 2) {
        return;
    }

    // Split the pathname into parts
    let pathParts = location.pathname.split('/').filter(Boolean); // filter(Boolean) removes any empty parts
    
    // If the first part of the path is a 2-letter language code, handle it
    if (pathParts[0] && pathParts[0].length === 2) {
        if (language === '') {
            // If language is empty, remove the language part
            pathParts.shift();
        } else {
            // Replace the language code with the new one
            pathParts[0] = language;
        }
    } else if (language !== '') {
        // If no language is present and language is 2 chars, prepend the language
        pathParts.unshift(language);
    }

    // Update the location pathname
    location.pathname = '/' + pathParts.join('/');
}

function ttmSetLanguage(key, language) {
	switch (language) {
		case '':
			language = location.pathname.split('/')[1];
			if (language.length !== 2) {
				language = ttmGetLocalStorage(key);
			}
			break;
		case 'en':
			language = '';
			break;
	}
	ttmSetLocalStorage(key, language);

	return language;
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
