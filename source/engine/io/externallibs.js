let externalLibLocation = null;
let loadedExternalLibs = new Set ();
let loadedExternalLibUrls = new Set ();

/**
 * Sets the location of the external libraries used by the engine. This is the content of the libs
 * folder in the package. The location must be relative to the main file.
 * @param {string} newExternalLibLocation Relative path to the libs folder.
 */
export function SetExternalLibLocation (newExternalLibLocation)
{
    externalLibLocation = newExternalLibLocation;
}

export function GetExternalLibPath (libName)
{
    if (externalLibLocation === null) {
        return null;
    }
    return externalLibLocation + '/' + libName;
}

export function LoadExternalLibraryFromLibs (libName)
{
    return new Promise ((resolve, reject) => {
        if (externalLibLocation === null) {
            reject ();
            return;
        }

        if (loadedExternalLibs.has (libName)) {
            resolve ();
            return;
        }

        let scriptElement = document.createElement ('script');
        scriptElement.type = 'text/javascript';
        scriptElement.src = GetExternalLibPath (libName);
        scriptElement.onload = () => {
            loadedExternalLibs.add (libName);
            resolve ();
        };
        scriptElement.onerror = () => {
            reject ();
        };
        document.head.appendChild (scriptElement);
    });
}

export function LoadExternalLibraryFromUrl (libraryUrl)
{
    return new Promise ((resolve, reject) => {
        if (externalLibLocation === null) {
            reject ();
            return;
        }

        if (loadedExternalLibUrls.has (libraryUrl)) {
            resolve ();
            return;
        }

        let scriptElement = document.createElement ('script');
        scriptElement.type = 'text/javascript';
        scriptElement.src = libraryUrl;
        scriptElement.onload = () => {
            loadedExternalLibUrls.add (libraryUrl);
            resolve ();
        };
        scriptElement.onerror = () => {
            reject ();
        };
        document.head.appendChild (scriptElement);
    });
}