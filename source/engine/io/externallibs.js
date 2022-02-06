let externalLibLocation = null;
let loadedExternalLibs = new Set ();

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
