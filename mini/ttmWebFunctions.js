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

// Helper function to check if a segment is a language code
function ttmIsLanguageCode(segment) {
    // List of valid language codes
    const languageCodes = ['fr', 'en', 'de', 'it', 'es'];
    
    return languageCodes.includes(segment);
}

// Helper function to check if a segment is a gym code
function ttmIsGymCode(segment) {
    return segment.length === 2 && !ttmIsLanguageCode(segment);
}

/**
 * Finds the language code in the path segments.
 * @param {Array} pathSegments - Array of path segments.
 * @returns {string|null} - The language code if found, otherwise null.
 */
function ttmFindLanguage(pathSegments) {
    if (pathSegments.length > 0 && ttmIsLanguageCode(pathSegments[0])) {
        return pathSegments[0];
    }
    return null;
}

/**
 * Finds the gym code in the path segments.
 * @param {Array} pathSegments - Array of path segments.
 * @returns {string|null} - The gym code if found, otherwise null.
 */
function ttmFindGym(pathSegments) {
    if (pathSegments.length > 0) {
        if (ttmIsLanguageCode(pathSegments[0])) {
            if (pathSegments.length > 1 && ttmIsGymCode(pathSegments[1])) {
                return pathSegments[1];
            }
        } else if (ttmIsGymCode(pathSegments[0])) {
            return pathSegments[0];
        }
    }
    return null;
}

/**
 * Replaces the language code in the path segments with a new one.
 * @param {Array} pathSegments - Array of path segments.
 * @param {string} newLanguage - The new language code.
 * @returns {Array} - Modified array of path segments.
 */
function ttmReplaceLanguage(pathSegments, newLanguage) {
    let newPathSegments = pathSegments.slice();
    if (ttmIsLanguageCode(newLanguage)) {
        if (newPathSegments.length > 0 && ttmIsLanguageCode(newPathSegments[0])) {
            newPathSegments[0] = newLanguage;
        } else {
            newPathSegments.unshift(newLanguage);
        }
    } else {
        // Remove existing language code if newLanguage is invalid
        newPathSegments = ttmRemoveLanguage(newPathSegments);
    }
    return newPathSegments;
}

/**
 * Replaces the gym code in the path segments with a new one.
 * @param {Array} pathSegments - Array of path segments.
 * @param {string} newGym - The new gym code.
 * @returns {Array} - Modified array of path segments.
 */
function ttmReplaceGym(pathSegments, newGym) {
    let newPathSegments = pathSegments.slice();
    if (newGym != null && ttmIsGymCode(newGym)) {
        if (newPathSegments.length > 0) {
            if (ttmIsLanguageCode(newPathSegments[0])) {
                if (newPathSegments.length > 1 && ttmIsGymCode(newPathSegments[1])) {
                    newPathSegments[1] = newGym;
                } else {
                    newPathSegments.splice(1, 0, newGym);
                }
            } else if (ttmIsGymCode(newPathSegments[0])) {
                newPathSegments[0] = newGym;
            } else {
                newPathSegments.unshift(newGym);
            }
        } else {
            newPathSegments.push(newGym);
        }
    } else {
        // Remove existing gym code if newGym is invalid
        newPathSegments = ttmRemoveGym(newPathSegments);
    }
    return newPathSegments;
}

/**
 * Inserts a language code into the path segments.
 * @param {Array} pathSegments - Array of path segments.
 * @param {string} language - The language code to insert.
 * @returns {Array} - Modified array of path segments.
 */
function ttmInsertLanguage(pathSegments, language) {
    if (ttmIsLanguageCode(language)) {
        let newPathSegments = pathSegments.slice();
        if (newPathSegments.length === 0 || !ttmIsLanguageCode(newPathSegments[0])) {
            newPathSegments.unshift(language);
        }
        // Else, language code already exists at the beginning
        return newPathSegments;
    } else {
        // Invalid language code; return the original segments
        return pathSegments.slice();
    }
}

/**
 * Inserts a gym code into the path segments.
 * @param {Array} pathSegments - Array of path segments.
 * @param {string} gym - The gym code to insert.
 * @returns {Array} - Modified array of path segments.
 */
function ttmInsertGym(pathSegments, gym) {
    if (ttmIsGymCode(gym)) {
        let newPathSegments = pathSegments.slice();
        if (newPathSegments.length === 0) {
            newPathSegments.push(gym);
        } else {
            if (ttmIsLanguageCode(newPathSegments[0])) {
                if (newPathSegments.length === 1 || !ttmIsGymCode(newPathSegments[1])) {
                    newPathSegments.splice(1, 0, gym);
                }
                // Else, gym code already exists at the second position
            } else if (!ttmIsGymCode(newPathSegments[0])) {
                newPathSegments.unshift(gym);
            }
            // Else, gym code already exists at the beginning
        }
        return newPathSegments;
    } else {
        // Invalid gym code; return the original segments
        return pathSegments.slice();
    }
}

/**
 * Removes the language code from the path segments.
 * @param {Array} pathSegments - Array of path segments.
 * @returns {Array} - Modified array of path segments without the language code.
 */
function ttmRemoveLanguage(pathSegments) {
    if (pathSegments.length > 0 && ttmIsLanguageCode(pathSegments[0])) {
        return pathSegments.slice(1);
    }
    return pathSegments.slice();
}

/**
 * Removes the gym code from the path segments.
 * @param {Array} pathSegments - Array of path segments.
 * @returns {Array} - Modified array of path segments without the gym code.
 */
function ttmRemoveGym(pathSegments) {
    let newPathSegments = pathSegments.slice();
    if (newPathSegments.length > 0) {
        if (ttmIsLanguageCode(newPathSegments[0])) {
            if (newPathSegments.length > 1 && ttmIsGymCode(newPathSegments[1])) {
                newPathSegments.splice(1, 1);
            }
        } else if (ttmIsGymCode(newPathSegments[0])) {
            newPathSegments.splice(0, 1);
        }
    }
    return newPathSegments;
}

// Function to switch to a specific gym by updating the URL pathname
function ttmSwitchToGym(gym) {
    if (gym) {
        const currentUrl = new URL(window.location.href);
        let pathSegments = currentUrl.pathname.split('/').filter(Boolean);

        // Use the replaceGym helper function to update the gym code in the path
        pathSegments = ttmReplaceGym(pathSegments, gym);

        // Reconstruct the URL pathname
        currentUrl.pathname = '/' + pathSegments.join('/');

        // Navigate to the new URL
        window.location.href = currentUrl.toString();
    }
}

// Function to set the gym location based on the URL or localStorage
function ttmSetGymLocation() {
    const pathSegments = window.location.pathname.split('/').filter(Boolean);
    let gymLocation = ttmFindGym(pathSegments); // Use findGym to get the gym code

    if (!gymLocation) {
        // If no gym code in the URL, retrieve it from localStorage
        gymLocation = ttmGetLocalStorage('totem');
    } else {
        // If gym code is found in the URL, save it to localStorage
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

    // Get the gym code from 'href' or 'data-gym' attribute
    let href = targetElement.getAttribute('href') || targetElement.getAttribute('data-gym');

    if (href && href.startsWith('/')) {
        // Extract the new gym code from the href
        const newGymCode = href.split('/').filter(Boolean)[0];

        // Validate the new gym code
        if (!ttmIsGymCode(newGymCode)) {
            console.error('Invalid gym code:', newGymCode);
            return;
        }

        const currentUrl = new URL(window.location.href);
        let pathSegments = currentUrl.pathname.split('/').filter(Boolean);

        // Use the replaceGym helper function to update the gym code in the path
        pathSegments = ttmReplaceGym(pathSegments, newGymCode);

        // Reconstruct the URL pathname
        const newPath = '/' + pathSegments.join('/');
        const newUrl = currentUrl.origin + newPath;

        // Navigate to the new URL
        window.location.href = newUrl;
    }
}
// Global variable to store the gym location
var totemLocation = 'undefined';
