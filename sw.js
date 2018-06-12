

console.log('sw')
    
self.addEventListener('fetch', function(event) {
        console.log('fetching', event.request)
    });