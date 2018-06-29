import idb from 'idb';

// const dbPromides = idb.open('rest-store', 1, upgradeDB => {
//     upgradeDB.createObjectStore('keyval')
// });

let dbPromise = idb.open('test-db', 1 , upgradeDB => {
    let keyValStore = upgradeDB.createObjectStore('keyval')
    keyValStore.put('TestValue','key');
})



dbPromise.then(function (db) {
    var tx = db.transaction('keyval');
    var keyValStore = tx.objectStore('keyval')
    return keyValStore.get('key');
}).then(val => console.log(val))

