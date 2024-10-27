
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
    let href = event.currentTarget.getAttribute('href');
	let validCurrentTarget = true;

	if (href === null) {
		href = event.target.getAttribute('href');
		validCurrentTarget = false;
	}
    if (href && href.startsWith('/')) {
        const currentUrl = new URL(window.location.href);
        const newSegment = href.split('/').filter(Boolean)[0];
        let currentPathSegments = currentUrl.pathname.split('/').filter(Boolean);

        if (newSegment) {
            if (currentPathSegments.length >= 1 && currentPathSegments[0].length === 2) {
                // Replace the existing gym location with the new one
                currentPathSegments[0] = newSegment;
            } else {
                // Insert the new gym location at the beginning of the path
                currentPathSegments.unshift(newSegment);
            }
            const newPath = currentUrl.origin + '/' + currentPathSegments.join('/');

            // Update the href attribute
            if (validCurrentTarget) {
				event.currentTarget.href = newPath;
			} else {
				event.target.href = newPath;
			}
        }
    }
}

var totemLocation = 'undefined';
