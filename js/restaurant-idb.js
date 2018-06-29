// open an put a value on the db
const dbPromise = idb.open('restaurant-db', 1, upgradeDB => {
    switch (upgradeDB.oldVersion) {
        case 0:
            let keyValStore = upgradeDB.createObjectStore('restaurants', {keyPath: 'id'})
            keyValStore.put('TestValue', 'key');
        // case 1:
        //     upgradeDB.createObjectStore('people', { keyPath: 'name' });
        // case 2:
        //     let peopleStore = upgradeDB.transaction.objectStore('people');
        //     peopleStore.createIndex('age', 'age');
    }
})
