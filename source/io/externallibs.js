OV.ExternalLibLocation = null;
OV.LoadedExternalLibs = new Set ();

OV.LoadExternalLibrary = function (libName)
{
    return new Promise ((resolve, reject) => {
        if (OV.ExternalLibLocation === null) {
            reject ();
            return;
        }

        if (OV.LoadedExternalLibs.has (libName)) {
            resolve ();
            return;
        }

        let scriptElement = document.createElement ('script');
        scriptElement.type = 'text/javascript';
        scriptElement.src = OV.ExternalLibLocation + '/' + libName;
        scriptElement.onload = () => {
            OV.LoadedExternalLibs.add (libName);
            resolve ();
        };
        scriptElement.onerror = () => {
            reject ();
        };
        document.head.appendChild (scriptElement);
    });
};
