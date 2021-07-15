OV.ExternalLibLocation = null;

OV.LoadedExternalLibs = {};

OV.LoadExternalLibrary = function (libName, callbacks)
{
    if (OV.ExternalLibLocation === null) {
        callbacks.error ();
        return;
    }

    if (OV.LoadedExternalLibs[libName] !== undefined) {
        callbacks.success ();
        return;
    }

    let scriptElement = document.createElement ('script');
    scriptElement.type = 'text/javascript';
    scriptElement.src = OV.ExternalLibLocation + '/' + libName;
    scriptElement.onload = function () {
        callbacks.success ();
        OV.LoadedExternalLibs[libName] = true;
    };
    scriptElement.onerror = callbacks.error;
    document.head.appendChild (scriptElement);
};
