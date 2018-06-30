// open an put a value on the db
const restDB = idb.open('restaurant-db', 1, upgradeDB => {
    switch (upgradeDB.oldVersion) {
        case 0:
            upgradeDB.createObjectStore('restaurants', {keyPath: 'id'})
            // fetch and add all restaurants to the db
            fetch(`http://localhost:1337/restaurants`).then(function (res) {
                // fetch all restaurant to db on the start

                res.json()
                    .then(restaurants => {
                        restaurants.forEach(restaurant => {
                            // console.log('restaurant', restaurant)
                            let item = restaurant;
                            restDB.then(function (db,restaurant) {
                                
                                var tx = db.transaction('restaurants', 'readwrite');
                                var restaurantsStore = tx.objectStore('restaurants')
                                restaurantsStore.put(item);
                                return tx.complete;
                            })
                        });
                    })
                    .catch(error => console.log(error))
            })
        // case 1:
        //     upgradeDB.createObjectStore('people', { keyPath: 'name' });
        // case 2:
        //     let peopleStore = upgradeDB.transaction.objectStore('people');
        //     peopleStore.createIndex('age', 'age');
    }
})



