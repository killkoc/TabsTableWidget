;// Function to retrieve a value from localStorage
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

// Set the default Language for a given site
function ttmSetDefaultLanguage(language) {
    ttmDefaultLanguage = language;
}

// Get default Language from local storage
function ttmGetDefaultLanguage() {
        /***    let defaultLanguage = ttmGetLocalStorage('ttmDefaultLang');
            
            // Check if default language is already set in localStorage
            if (!defaultLanguage) {
                defaultLanguage = 'en';
            }
        ***/
    return ttmDefaultLanguage;
}

/**
 * Checks if a segment is a valid language code.
 * @param {string} segment - The path segment to check.
 * @returns {boolean} - True if it's a valid language code.
 */
function ttmIsLanguageCode(segment) {
    // List of valid language codes
    const languageCodes = ['fr', 'en', 'de', 'it', 'es'];

    return languageCodes.includes(segment);
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
 * Replaces or removes the language code in the path segments based on the default language.
 * @param {Array} pathSegments - Array of path segments.
 * @param {string} newLanguage - The new language code.
 * @returns {Array} - Modified array of path segments.
 */
function ttmReplaceLanguage(pathSegments, newLanguage) {
    let segments = [...pathSegments];
    const defaultLanguage = ttmGetDefaultLanguage();

    // Remove existing language code if present
    if (segments.length > 0 && ttmIsLanguageCode(segments[0])) {
        segments.shift();
    }
    // If the new language is not the default, add it to the URL
    if (newLanguage !== defaultLanguage) {
        segments.unshift(newLanguage);
    }
    // If newLanguage is the default, we don't include it in the URL
    return segments;
}

/**
 * Inserts a language code into the path segments if it's not already present.
 * @param {Array} pathSegments - Array of path segments.
 * @param {string} language - The language code to insert.
 * @returns {Array} - Modified array of path segments.
 */
function ttmInsertLanguage(pathSegments, language) {
    let segments = [...pathSegments];
    const defaultLanguage = ttmGetDefaultLanguage();

    // Remove existing language code if present
    if (segments.length > 0 && ttmIsLanguageCode(segments[0])) {
        segments.shift();
    }
    // If the language is not the default, insert it
    if (language !== defaultLanguage) {
        segments.unshift(language);
    }
    // If the language is the default, do not insert it
    return segments;
}

/**
 * Switches the current URL to the specified language.
 * Omits the default language code from the URL.
 * @param {string} language - The language code to switch to.
 */
function ttmSwitchToLanguage(language) {
    if (!ttmIsLanguageCode(language)) {
        console.error('Invalid language code:', language);
        return;
    }
    const defaultLanguage = ttmGetDefaultLanguage();
 debugger;

    const currentUrl = new URL(window.location.href);
    let pathSegments = currentUrl.pathname.split('/').filter(Boolean);

    // Insert the new language code
    pathSegments = ttmInsertLanguage(pathSegments, language);

    const newPath = '/' + pathSegments.join('/');
    // Only update if there's a change
    if (newPath !== currentUrl.pathname) {
        currentUrl.pathname = newPath;
        window.location.href = currentUrl.toString();
    }
    return language;
}

/**
 * Sets the language based on the provided language code or retrieves it from the URL or localStorage.
 * @param {string} key - The localStorage key for the language setting.
 * @param {string} language - The language code to set.
 * @returns {string} - The language code that has been set.
 */
function ttmSetLanguage(key, language) {
    const defaultLanguage = ttmGetDefaultLanguage();

    if (!language) {
        // If language is not provided, get it from the URL or localStorage
        const pathSegments = window.location.pathname.split('/').filter(Boolean);
        language = ttmFindLanguage(pathSegments) || ttmGetLocalStorage(key) || defaultLanguage;
    }
    // Save the language to localStorage
    ttmSetLocalStorage(key, language);
    ttmLanguage = language;

    return language;
}

// Helper function to check if a segment is a gym code
function ttmIsGymCode(segment) {
    return segment.length === 2 && !ttmIsLanguageCode(segment);
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
 * Inserts a gym code into the path segments if it's not already present.
 * @param {Array} pathSegments - Array of path segments.
 * @param {string} gym - The gym code to insert.
 * @returns {Array} - Modified array of path segments.
 */
function ttmInsertGym(pathSegments, gym) {
    if (!ttmIsGymCode(gym)) return pathSegments.slice(); // Invalid gym code

    let segments = [...pathSegments];
    let index = 0;

    // Determine the position to insert the gym code
    if (segments.length > 0 && ttmIsLanguageCode(segments[0])) {
        index = 1;
    }
    // Insert gym code if not already present at the determined index
    if (segments.length <= index || !ttmIsGymCode(segments[index])) {
        segments.splice(index, 0, gym);
    }
    return segments;
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
        if (!ttmIsGymCode(gym)) {
            console.error('Invalid gym code:', gym);
            return;
        }
        const currentUrl = new URL(window.location.href);
        let pathSegments = currentUrl.pathname.split('/').filter(Boolean);

        // Remove existing gym code if present
        pathSegments = ttmRemoveGym(pathSegments);

        // Insert the new gym code
        pathSegments = ttmInsertGym(pathSegments, gym);

        // Reconstruct the URL pathname
        currentUrl.pathname = '/' + pathSegments.join('/');

        // Navigate to the new URL without creating a new history entry
        window.location.replace(currentUrl.toString());        // Navigate to the new URL
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
    ttmLocation = gymLocation;
    
    return gymLocation;
}

// Function to add click event listeners to elements with class 'gymButton' when the document is ready
function ttmAddGymButtonsEventListener() {
    document.addEventListener('DOMContentLoaded', function() {
        document.querySelectorAll('.gymButton').forEach(function(button) {
            button.addEventListener('click', ttmGymChoiceClicked);
        });
    });
}

// Function to add click event listeners to elements with class 'gymButton' when the document is ready
function ttmAddGymNavEventListener() {
    document.addEventListener('DOMContentLoaded', function() {
        document.querySelectorAll('.gymButton').forEach(function(button) {
            button.addEventListener('click', ttmGymChoiceClicked);
        });
        document.querySelectorAll('.ttmGymChoicesClass').forEach(function(button) {
            button.addEventListener('click', ttmGymChoiceClicked);
        });
        document.querySelectorAll('.ttmGymOptionsClass').forEach(function(button) {
            button.addEventListener('click', ttmGymOptionClicked);
        });
    });
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

        // Remove existing gym code if present
        pathSegments = ttmRemoveGym(pathSegments);

        // Insert the new gym code
        pathSegments = ttmInsertGym(pathSegments, newGymCode);

        // Reconstruct the URL pathname
        const newPath = '/' + pathSegments.join('/');
        const newUrl = currentUrl.origin + newPath;

        // Navigate to the new URL
        window.location.href = newUrl;
    }
}

// Function to handle the click event for gym options menu
function ttmGymOptionClicked(event) {
    event.preventDefault(); // Prevent the default action

    // Get the href of the clicked element
    let href = event.target.getAttribute('href');

    if (href && (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('/'))) {
        // Parse the target URL
        let targetUrl = new URL(href, window.location.origin);
        let targetPathSegments = targetUrl.pathname.split('/').filter(Boolean);

        // Check if the target URL has language or gym code
        let targetLanguage = ttmFindLanguage(targetPathSegments);
        let targetGym = ttmFindGym(targetPathSegments);

        // Get the current language and gym code from the current URL
        let currentPathSegments = window.location.pathname.split('/').filter(Boolean);
        let currentLanguage = ttmFindLanguage(currentPathSegments);
        let currentGym = ttmFindGym(currentPathSegments);

        // Retrieve default language
        const defaultLanguage = ttmGetDefaultLanguage();

        // Insert current language code if missing in the target URL
        if (!targetLanguage && currentLanguage) {
            targetPathSegments = ttmInsertLanguage(targetPathSegments, currentLanguage);
        }
        // Insert current gym code if missing in the target URL
        if (!targetGym && currentGym) {
            targetPathSegments = ttmInsertGym(targetPathSegments, currentGym);
        }
        // Reconstruct the target URL pathname
        targetUrl.pathname = '/' + targetPathSegments.join('/');

        // Navigate to the new URL
        window.location.href = targetUrl.toString();
    }
}

// Global variable to store the gym location
var ttmLocation = ttmGetLocalStorage('totem');

// Global variable to store the gym location
var ttmLanguage = ttmGetLocalStorage('ttmLanguage');

// Global variable to store the default language for the site
var ttmDefaultLanguage = 'fr';
