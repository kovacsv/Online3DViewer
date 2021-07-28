OV.ExternalLibLocation = null;

OV.LoadedExternalLibs = {};

OV.LoadExternalLibrary = function (libName)
{
    return new Promise ((resolve, reject) => {
        if (OV.ExternalLibLocation === null) {
            reject ();
            return;
        }
    
        if (OV.LoadedExternalLibs[libName] !== undefined) {
            resolve ();
            return;
        }
    
        let scriptElement = document.createElement ('script');
        scriptElement.type = 'text/javascript';
        scriptElement.src = OV.ExternalLibLocation + '/' + libName;
        scriptElement.onload = () => {
            OV.LoadedExternalLibs[libName] = true;
            resolve ();
        };
        scriptElement.onerror = () => {
            reject ();
        };
        document.head.appendChild (scriptElement);
    });
};
