let externalLibLocation = null;
let loadedExternalLibs = new Set ();

export function SetExternalLibLocation (newExternalLibLocation)
{
    externalLibLocation = newExternalLibLocation;
}

export function LoadExternalLibrary (libName)
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
        scriptElement.src = externalLibLocation + '/' + libName;
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
