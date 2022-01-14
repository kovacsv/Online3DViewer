let eventHandlerFunc = null;

export function SetEventHandler (eventHandler)
{
    eventHandlerFunc = eventHandler;
}

export function HandleEvent (eventName, eventLabel, eventParams)
{
    if (eventHandlerFunc === undefined || eventHandlerFunc === null) {
        return;
    }
    eventHandlerFunc (eventName, eventLabel, eventParams);
}
