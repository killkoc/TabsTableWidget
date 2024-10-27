// Function to retrieve a value from localStorage
function ttmGetLocalStorage(key) {
    if (typeof(Storage) !== 'undefined') {
        return localStorage.getItem(key);
    }
    return null; // Return null if localStorage is not available
}

// Function to store a value in localStorage
function ttmSetLocalStorage(key, value) {
    if (typeof(Storage) !== 'undefined') {
        localStorage.setItem(key, value);
    }
}

// Function to switch to a specific gym by updating the URL pathname
function ttmSwitchToGym(gym) {
    if (gym) {
        const currentUrl = new URL(window.location.href);
        let pathSegments = currentUrl.pathname.split('/').filter(Boolean);

        // Remove existing gym code if present
        if (pathSegments[0] && pathSegments[0].length === 2) {
            pathSegments[0] = gym;
        } else {
            pathSegments.unshift(gym);
        }
        currentUrl.pathname = '/' + pathSegments.join('/');
        window.location.href = currentUrl.toString();
    }
}

// Function to set the gym location based on the URL or localStorage
function ttmSetGymLocation() {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    let gymLocation = pathSegments[0]; // Get the first path segment

    if (!gymLocation || gymLocation.length !== 2) {
        gymLocation = ttmGetLocalStorage('totem');
    } else {
        ttmSetLocalStorage('totem', gymLocation);
    }
    return gymLocation;
}

// Function to switch to a specific language by modifying the URL pathname
function ttmSwitchToLanguage(language) {
    if (language == null || language.length > 2) return; // Explicit check for null or invalid language code

    const pathParts = location.pathname.split('/').filter(Boolean); // Remove empty segments
    const hasLanguage = pathParts[0] && pathParts[0].length === 2; // Check if the first segment is a language code

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
    // Only update if there's a change
    if (newPath !== window.location.pathname) {
        window.location.pathname = newPath;
    }

    return pathParts.join('/');
}

// Function to set the language based on the key and provided language code
function ttmSetLanguage(key, language) {
    switch (language) {
        case '':
            // If language is empty, get it from the URL or localStorage
            language = location.pathname.split('/')[1];
            if (language.length !== 2) {
                language = ttmGetLocalStorage(key);
            }
            break;
        case 'en':
            // If language is 'en', set it to empty string (default)
            language = '';
            break;
    }
    // Save the language to localStorage
    ttmSetLocalStorage(key, language);

    return language;
}

// Function to add click event listeners to elements with class 'gymButton' when the document is ready
function ttmAddGymButtonsEventListener() {
    document.addEventListener('DOMContentLoaded', function() {
        document.querySelectorAll('.gymButton').forEach(function(button) {
            button.addEventListener('click', ttmGymChoiceClicked);
        });
    });
}

// Function to handle the click event for gym buttons
function ttmGymButtonClicked(event) {
    const pathArray = location.pathname.split('/');
    const targetSite = event.currentTarget.href;

    if (pathArray.length > 2) {
        // If there are more than two segments in the path, append the third segment to the targetSite
        event.currentTarget.href = targetSite + '/' + pathArray[2];
    } else if (pathArray.length == 2 && pathArray[1].length > 2) {
        // If there are exactly two segments and the second is longer than 2 characters
        event.currentTarget.href = targetSite + '/' + pathArray[1];
    }
}

// Function to handle the click event for gym choice
function ttmGymChoiceClicked(event) {
    event.preventDefault(); // Prevent the default action

    // Find the closest anchor or button element
    let targetElement = event.target.closest('a, button');

    if (!targetElement) {
        return; // Exit if no valid element is found
    }

    // Get the gym location from 'href' or 'data-gym' attribute
    let href = targetElement.getAttribute('href') || targetElement.getAttribute('data-gym');

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

// Global variable to store the gym location (currently unused)
var totemLocation = 'undefined';
