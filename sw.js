
const cache_name = 'restaurant-cache-v1'

self.addEventListener('install', function (event) {
    let urlsToCache = [
        '/css/styles.css',
        '/index.html'
    ]

    event.waitUntil(
        caches.open(cache_name).then(cache =>{
           return cache.addAll(urlsToCache);
        })
    )
})

    
self.addEventListener('fetch', function (event) {
    event.respondWith(
        // match the request in any cache stored
        caches.match(event.request).then(function (response) {
                // if there is a match return it || fetch the response and add to the cache
                return response || fetch(event.request).then(function (response) {
                    return caches.open(cache_name).then(function(cache){
                        cache.put(event.request, response.clone());
                        return response;
                    })
                });
        })
    );
});