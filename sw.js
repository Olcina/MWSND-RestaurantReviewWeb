

/**
 * service worker registration
 */
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
        navigator.serviceWorker.register('/sw.js').then(function (registration) {
            // Registration was successful
            console.log('ServiceWorker registration successful with scope: ', registration.scope);
        }, function (err) {
            // registration failed :(
            console.log('ServiceWorker registration failed: ', err);
        });
    });
} else {
    console.log('Service Worker is not supported in this browser.');
}

// cache name
const cache_version = 'restaurant-cache-v1'

self.addEventListener('install', function (event) {
    event.waitUntil( console.log('a new service workers was installed') )

})

// delete old caches when activation takes place
self.addEventListener('activate', function(event) {
    event.waitUntil (
        caches.keys().then(keys => {
            return Promise.all(keys.map(function (key, i) {
                if(key != cache_version) {
                    return caches.delete(keys[i])
                }
            }))
        })
    )

});

// add all request data to the cache 
self.addEventListener('fetch', function (event) {
    event.respondWith(
        // match the request in any cache stored
        caches.match(event.request).then(function (response) {
                // if there is a match return it || fetch the response and add to the cache
                return response || fetch(event.request).then(function (response) {
                    return caches.open(cache_version).then(function(cache){
                        cache.put(event.request, response.clone());
                        return response;
                    })
                });
        })
    );
});