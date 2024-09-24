let loadedExternalLibUrls = new Set ();

export function LoadExternalLibraryFromUrl (libraryUrl)
{
    return new Promise ((resolve, reject) => {
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
