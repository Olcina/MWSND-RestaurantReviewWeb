

/**
 * service worker registration
 */

console.log('holi sw!');


importScripts('https://storage.googleapis.com/workbox-cdn/releases/3.4.1/workbox-sw.js');

if (workbox) {
    console.log(`Yay! Workbox is loaded 🎉`);
} else {
    console.log(`Boo! Workbox didn't load 😬`);
}
// CACHE ASSETS WITH WORKBOX
// javascript
workbox.routing.registerRoute(
    new RegExp('.*\.js'),
    workbox.strategies.staleWhileRevalidate({
        cacheName: 'js-cache',
    })
);
// css
workbox.routing.registerRoute(
    new RegExp('.*\.css'),
    workbox.strategies.staleWhileRevalidate({
        cacheName: 'css-cache',
    })
);
// html
workbox.routing.registerRoute(
    new RegExp('.*\.html'),
    workbox.strategies.staleWhileRevalidate({
        cacheName: 'html-cache',
    })
);
// html
workbox.routing.registerRoute(
    '/',
    workbox.strategies.staleWhileRevalidate({
        cacheName: 'html-cache',
    })
);

// jpg
workbox.routing.registerRoute(
    new RegExp('.*\.(?:jpg|gif|png)'),
    workbox.strategies.staleWhileRevalidate({
        cacheName: 'images-cache',
    })
);
// maps assets
workbox.routing.registerRoute(
    new RegExp('.*\.(?:cur|woff2)'),
    workbox.strategies.staleWhileRevalidate({
        cacheName: 'maps-cache',
    })
);

// create a queue of fetching request for user when is offline
const queue = new workbox.backgroundSync.Queue('user-action-queue');

self.addEventListener('fetch', (event) => {
    // Clone the request to ensure it's save to read when
    // adding to the Queue.
    console.log('QUEUE FETCH', event);
    
    const promiseChain = fetch(event.request.clone())
        .catch((err) => {
            console.log(err);
            
            return queue.addRequest(event.request);
        });

    event.waitUntil(promiseChain);
});


// // cache name
// const cache_version = 'restaurant-cache-v1'

// self.addEventListener('install', function (event) {
//     event.waitUntil( console.log('a new service workers was installed') )

// })

// // delete old caches when activation takes place
// self.addEventListener('activate', function(event) {
//     event.waitUntil (
//         caches.keys().then(keys => {
//             return Promise.all(keys.map(function (key, i) {
//                 if(key != cache_version) {
//                     return caches.delete(keys[i])
//                 }
//             }))
//         })
//     )

// });

// // add all request data to the cache 
// self.addEventListener('fetch', function (event) {
//     event.respondWith(
//         // match the request in any cache stored
//         caches.match(event.request).then(function (response) {
//                 // if there is a match return it || fetch the response and add to the cache
//                 return response || fetch(event.request).then(function (response) {
//                     return caches.open(cache_version).then(function(cache){
//                         cache.put(event.request, response.clone());
//                         return response;
//                     })
//                 });
//         })
//     );
// });

