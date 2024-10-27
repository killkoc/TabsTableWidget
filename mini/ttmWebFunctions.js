
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
	} else {
		ttmSetLocalStorage('totem', gymLocation);
	}
	return(gymLocation);
}

function ttmSwitchToLanguage(language) {
    if (language == null || language.length > 2) return; // Explicit check for null or undefined

    const pathParts = location.pathname.split('/').filter(Boolean); // Remove empty parts
    const hasLanguage = pathParts[0]?.length === 2;

    // Modify path parts based on the language provided
    if (hasLanguage) {
        if (language === '') {
            // Remove the language part if the language is empty
            pathParts.shift();
        } else {
            // Replace the existing language with the new one
            pathParts[0] = language;
        }
    } else if (language !== '') {
        // If no language is present and a valid one is provided, prepend it
        pathParts.unshift(language);
    }
    const newPath = '/' + pathParts.join('/');
    if (newPath !== window.location.pathname) window.location.pathname = newPath; // Only update if there's a change

    return pathParts.join('/');
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
	$(document).ready(function() {
	    document.querySelectorAll('.gymButton').forEach(function(button) {
	        button.addEventListener('click', function(event) {
	            ttmGymChoiceClicked(event); // Pass the event to the function
	        });
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

function ttmGymChoiceClicked(event) {
    event.preventDefault(); // Prevent the default action

    // Find the closest anchor or button element
    var targetElement = event.target.closest('a, button');
    if (!targetElement) {
        return; // Exit if no valid element is found
    }

    // Get the gym location from 'href' or 'data-gym' attribute
    var href = targetElement.getAttribute('href') || targetElement.getAttribute('data-gym');

    if (href && href.startsWith('/')) {
        const currentUrl = new URL(window.location.href);
        const newSegment = href.split('/').filter(Boolean)[0];
        let currentPathSegments = currentUrl.pathname.split('/').filter(Boolean);

        if (newSegment) {
            // Assume gym location codes are always 2 characters long
            if (currentPathSegments.length >= 1 && currentPathSegments[0].length === 2) {
                // Replace the existing gym location with the new one
                currentPathSegments[0] = newSegment;
            } else {
                // Insert the new gym location at the beginning of the path
                currentPathSegments.unshift(newSegment);
            }

            const newPath = '/' + currentPathSegments.join('/');
            const newUrl = currentUrl.origin + newPath;

            // Navigate to the new URL
            window.location.href = newUrl;
        }
    }
}

var totemLocation = 'undefined';
