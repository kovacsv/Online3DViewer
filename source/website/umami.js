
export function TrackUmamiEvent(eventName, eventData) {
    if (typeof window.umami !== 'undefined') {
        window.umami.track(eventName, eventData);
    } else {
        // If umami isn't available immediately, try again after a short delay
        setTimeout(() => {
            if (typeof window.umami !== 'undefined') {
                window.umami.track(eventName, eventData);
            } else {
                console.warn('Umami is not available. Event not tracked:', eventName, eventData);
            }
        }, 1000); // Wait for 1 second before trying again
    }
}