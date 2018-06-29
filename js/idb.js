import idb from 'idb';

// const dbPromides = idb.open('rest-store', 1, upgradeDB => {
//     upgradeDB.createObjectStore('keyval')
// });


// open an put a value on the db
let dbPromise = idb.open('test-db', 3 , upgradeDB => {
    switch (upgradeDB.oldVersion) {
        case 0:
            let keyValStore = upgradeDB.createObjectStore('keyval')
            keyValStore.put('TestValue','key');
        case 1:
            upgradeDB.createObjectStore('people', {keyPath: 'name'});
        case 2: 
            let peopleStore = upgradeDB.transaction.objectStore('people');
            peopleStore.createIndex('age','age');
    }
})


// get the first value
dbPromise.then(function (db) {
    var tx = db.transaction('keyval');
    var keyValStore = tx.objectStore('keyval')
    return keyValStore.get('key');
}).then(val => console.log(val))

// put another value
dbPromise.then(function (db) {
    var tx = db.transaction('keyval', 'readwrite');
    var keyValStore = tx.objectStore('keyval');
    keyValStore.put('Another value', 'key1');
    return tx.complete;
}).then(function () {
  console.log('added vaklue');
    
})


// add people to de idb
dbPromise.then(db => {
    let tx = db.transaction('people', 'readwrite');
    var peopleStore = tx.objectStore('people');

    peopleStore.put({
        name: 'Carlos',
        age: 30,
        favouriteAnimal: 'cat'
    })
    peopleStore.put({
        name: 'Ari',
        age: 29,
        favouriteAnimal: 'dog'
    })
    peopleStore.put({
        name: 'Colgado',
        age: 50,
        favouriteAnimal: 'drogas'
    })

    return tx.complete;
}).then(console.log('added people to db'))


// read people
dbPromise.then(db => {
    let tx = db.transaction('people');
    let peopleStore = tx.objectStore('people');
    let ageStore = peopleStore.index('age')

    return ageStore.getAll()
}).then(people => {
    console.log(people);
})