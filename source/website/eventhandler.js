let eventHandlerFunc = null;

export function SetEventHandler (eventHandler)
{
    eventHandlerFunc = eventHandler;
}

export function HandleEvent (eventName, eventLabel)
{
    if (eventHandlerFunc === undefined || eventHandlerFunc === null) {
        return;
    }
    eventHandlerFunc (eventName, eventLabel);
}
