OV.ExternalLibLocation = null;

OV.LoadExternalLibrary = function (libName, callbacks)
{
    if (OV.ExternalLibLocation === null) {
        callbacks.error ();
        return;
    }
    let scriptElement = document.createElement ('script');
    scriptElement.type = 'text/javascript';
    scriptElement.src = OV.ExternalLibLocation + '/' + libName;
    scriptElement.onload = callbacks.success;
    scriptElement.onerror = callbacks.error;
    document.head.appendChild (scriptElement);
};
