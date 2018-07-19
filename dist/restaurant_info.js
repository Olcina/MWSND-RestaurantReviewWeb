'use strict';

(function () {
    function toArray(arr) {
        return Array.prototype.slice.call(arr);
    }

    function promisifyRequest(request) {
        return new Promise(function (resolve, reject) {
            request.onsuccess = function () {
                resolve(request.result);
            };

            request.onerror = function () {
                reject(request.error);
            };
        });
    }

    function promisifyRequestCall(obj, method, args) {
        var request;
        var p = new Promise(function (resolve, reject) {
            request = obj[method].apply(obj, args);
            promisifyRequest(request).then(resolve, reject);
        });

        p.request = request;
        return p;
    }

    function promisifyCursorRequestCall(obj, method, args) {
        var p = promisifyRequestCall(obj, method, args);
        return p.then(function (value) {
            if (!value) return;
            return new Cursor(value, p.request);
        });
    }

    function proxyProperties(ProxyClass, targetProp, properties) {
        properties.forEach(function (prop) {
            Object.defineProperty(ProxyClass.prototype, prop, {
                get: function () {
                    return this[targetProp][prop];
                },
                set: function (val) {
                    this[targetProp][prop] = val;
                }
            });
        });
    }

    function proxyRequestMethods(ProxyClass, targetProp, Constructor, properties) {
        properties.forEach(function (prop) {
            if (!(prop in Constructor.prototype)) return;
            ProxyClass.prototype[prop] = function () {
                return promisifyRequestCall(this[targetProp], prop, arguments);
            };
        });
    }

    function proxyMethods(ProxyClass, targetProp, Constructor, properties) {
        properties.forEach(function (prop) {
            if (!(prop in Constructor.prototype)) return;
            ProxyClass.prototype[prop] = function () {
                return this[targetProp][prop].apply(this[targetProp], arguments);
            };
        });
    }

    function proxyCursorRequestMethods(ProxyClass, targetProp, Constructor, properties) {
        properties.forEach(function (prop) {
            if (!(prop in Constructor.prototype)) return;
            ProxyClass.prototype[prop] = function () {
                return promisifyCursorRequestCall(this[targetProp], prop, arguments);
            };
        });
    }

    function Index(index) {
        this._index = index;
    }

    proxyProperties(Index, '_index', [
        'name',
        'keyPath',
        'multiEntry',
        'unique'
    ]);

    proxyRequestMethods(Index, '_index', IDBIndex, [
        'get',
        'getKey',
        'getAll',
        'getAllKeys',
        'count'
    ]);

    proxyCursorRequestMethods(Index, '_index', IDBIndex, [
        'openCursor',
        'openKeyCursor'
    ]);

    function Cursor(cursor, request) {
        this._cursor = cursor;
        this._request = request;
    }

    proxyProperties(Cursor, '_cursor', [
        'direction',
        'key',
        'primaryKey',
        'value'
    ]);

    proxyRequestMethods(Cursor, '_cursor', IDBCursor, [
        'update',
        'delete'
    ]);

    // proxy 'next' methods
    ['advance', 'continue', 'continuePrimaryKey'].forEach(function (methodName) {
        if (!(methodName in IDBCursor.prototype)) return;
        Cursor.prototype[methodName] = function () {
            var cursor = this;
            var args = arguments;
            return Promise.resolve().then(function () {
                cursor._cursor[methodName].apply(cursor._cursor, args);
                return promisifyRequest(cursor._request).then(function (value) {
                    if (!value) return;
                    return new Cursor(value, cursor._request);
                });
            });
        };
    });

    function ObjectStore(store) {
        this._store = store;
    }

    ObjectStore.prototype.createIndex = function () {
        return new Index(this._store.createIndex.apply(this._store, arguments));
    };

    ObjectStore.prototype.index = function () {
        return new Index(this._store.index.apply(this._store, arguments));
    };

    proxyProperties(ObjectStore, '_store', [
        'name',
        'keyPath',
        'indexNames',
        'autoIncrement'
    ]);

    proxyRequestMethods(ObjectStore, '_store', IDBObjectStore, [
        'put',
        'add',
        'delete',
        'clear',
        'get',
        'getAll',
        'getKey',
        'getAllKeys',
        'count'
    ]);

    proxyCursorRequestMethods(ObjectStore, '_store', IDBObjectStore, [
        'openCursor',
        'openKeyCursor'
    ]);

    proxyMethods(ObjectStore, '_store', IDBObjectStore, [
        'deleteIndex'
    ]);

    function Transaction(idbTransaction) {
        this._tx = idbTransaction;
        this.complete = new Promise(function (resolve, reject) {
            idbTransaction.oncomplete = function () {
                resolve();
            };
            idbTransaction.onerror = function () {
                reject(idbTransaction.error);
            };
            idbTransaction.onabort = function () {
                reject(idbTransaction.error);
            };
        });
    }

    Transaction.prototype.objectStore = function () {
        return new ObjectStore(this._tx.objectStore.apply(this._tx, arguments));
    };

    proxyProperties(Transaction, '_tx', [
        'objectStoreNames',
        'mode'
    ]);

    proxyMethods(Transaction, '_tx', IDBTransaction, [
        'abort'
    ]);

    function UpgradeDB(db, oldVersion, transaction) {
        this._db = db;
        this.oldVersion = oldVersion;
        this.transaction = new Transaction(transaction);
    }

    UpgradeDB.prototype.createObjectStore = function () {
        return new ObjectStore(this._db.createObjectStore.apply(this._db, arguments));
    };

    proxyProperties(UpgradeDB, '_db', [
        'name',
        'version',
        'objectStoreNames'
    ]);

    proxyMethods(UpgradeDB, '_db', IDBDatabase, [
        'deleteObjectStore',
        'close'
    ]);

    function DB(db) {
        this._db = db;
    }

    DB.prototype.transaction = function () {
        return new Transaction(this._db.transaction.apply(this._db, arguments));
    };

    proxyProperties(DB, '_db', [
        'name',
        'version',
        'objectStoreNames'
    ]);

    proxyMethods(DB, '_db', IDBDatabase, [
        'close'
    ]);

    // Add cursor iterators
    // TODO: remove this once browsers do the right thing with promises
    ['openCursor', 'openKeyCursor'].forEach(function (funcName) {
        [ObjectStore, Index].forEach(function (Constructor) {
            // Don't create iterateKeyCursor if openKeyCursor doesn't exist.
            if (!(funcName in Constructor.prototype)) return;

            Constructor.prototype[funcName.replace('open', 'iterate')] = function () {
                var args = toArray(arguments);
                var callback = args[args.length - 1];
                var nativeObject = this._store || this._index;
                var request = nativeObject[funcName].apply(nativeObject, args.slice(0, -1));
                request.onsuccess = function () {
                    callback(request.result);
                };
            };
        });
    });

    // polyfill getAll
    [Index, ObjectStore].forEach(function (Constructor) {
        if (Constructor.prototype.getAll) return;
        Constructor.prototype.getAll = function (query, count) {
            var instance = this;
            var items = [];

            return new Promise(function (resolve) {
                instance.iterateCursor(query, function (cursor) {
                    if (!cursor) {
                        resolve(items);
                        return;
                    }
                    items.push(cursor.value);

                    if (count !== undefined && items.length == count) {
                        resolve(items);
                        return;
                    }
                    cursor.continue();
                });
            });
        };
    });

    var exp = {
        open: function (name, version, upgradeCallback) {
            var p = promisifyRequestCall(indexedDB, 'open', [name, version]);
            var request = p.request;

            if (request) {
                request.onupgradeneeded = function (event) {
                    if (upgradeCallback) {
                        upgradeCallback(new UpgradeDB(request.result, event.oldVersion, request.transaction));
                    }
                };
            }

            return p.then(function (db) {
                return new DB(db);
            });
        },
        delete: function (name) {
            return promisifyRequestCall(indexedDB, 'deleteDatabase', [name]);
        }
    };

    if (typeof module !== 'undefined') {
        module.exports = exp;
        module.exports.default = module.exports;
    }
    else {
        self.idb = exp;
    }
}());
// open an put a value on the db
const restDB = idb.open('restaurant-db', 2, upgradeDB => {
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
        case 1:
            upgradeDB.createObjectStore('reviews', { keyPath: 'id' });

            fetch(`http://localhost:1337/reviews`).then(function (res) {
                res.json()
                    .then(reviews => {
                        reviews.forEach(review => {
                            let item = review;
                            restDB.then(function(db,review) {
                                var tx = db.transaction('reviews', 'readwrite');
                                var reviewsStore = tx.objectStore('reviews');
                                reviewsStore.put(item);
                                return tx.complete;
                            })
                        })
                    })
                
            })
        // case 2:
        //     let peopleStore = upgradeDB.transaction.objectStore('people');
        //     peopleStore.createIndex('age', 'age');
    }
})





 /**
 * Common database helper functions.
 */
class DBHelper {
  
  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 8000 // Change this to your server port
    return `http://localhost:${port}/data/restaurants.json`;
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    // try to fetch fro db fetch if no results
    restDB.then(db => {
      let tx = db.transaction('restaurants');
      let restaurantsStore = tx.objectStore('restaurants');
      
      
      return restaurantsStore.getAll()
    }).then( response => {
      
      if (response.length > 0) {
  
        
        return callback(null, response)
      } else {

        
        fetch(`http://localhost:1337/restaurants`).then(function (res) {
          
          res.json()

            .then(restaurants => callback(null, restaurants))
            .catch(error => callback(error, null))
        })
      }
    }).catch(error => callback('there was an error', null))

    
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // will try to fetch from restDB and if not exist then fetch from the network
    restDB.then(db => {
      let tx = db.transaction('restaurants');
      let restaurantsStore = tx.objectStore('restaurants');
      
      return restaurantsStore.getAll(parseInt(id));
    }).then( response => {
      // when db response has a value response with that value
      if (response.length>0) {
        
        return callback(null, response[0])
      }else {
        fetch(`http://localhost:1337/restaurants/${id}`).then(function (res) {
          // clone the response and add it to the idb
          // let res2 = res.clone()
          res.json().then(restaurant => {
    
            restDB.then(function (db) {
              let tx = db.transaction('restaurants', 'readwrite');
              let restaurantsStore = tx.objectStore('restaurants');

              restaurantsStore.put(restaurant);
              return tx.complete;
            }).then(function () {
              return callback(null, restaurant)
              }).catch(error => callback('Restaurant does not exist', null))
          }).catch(error => callback('Restaurant does not exist', null))

        }).catch(error => callback('there was an error', null))
      }
    })


  }
  /**
   * Fetch reviews for a restaurant by its ID.
   */
  static fetchRestaurantReviewsById(id, callback) {
   
    
    return restDB.then(db => {
      let tx = db.transaction('reviews');
      let reviewsStore = tx.objectStore('reviews');

      let raw_reviews = reviewsStore.getAll()
    
      return raw_reviews
    }).then(response => {
      let reviews = response.filter(review => review.restaurant_id == id)
      if (reviews.length > 0) {
       
        return reviews

      } else {
        // fetch from network
        return fetch(`http://localhost:1337/reviews/?restaurant_id=${id}`).then(function (res) {
         
          return res.json()
        }).then(function (myJson) {
        
          return myJson
        });
      }
    })


  


  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }
  /**
   * Review page URL.
   */
  static urlForRestaurantReviews(restaurant) {
    return (`http://localhost:1337/reviews/?restaurant_id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant, quality) {
    return (`/img/${quality}-${restaurant.photograph}`);
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  }

}

let restaurant;
var map;
let is_favorite;
/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
    }
  });
}

/**
 * Get current restaurant from page URL.
 */

const fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {

    
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      // get the reviews
      const reviews = DBHelper.fetchRestaurantReviewsById(id)
      
      console.log('restaurant', restaurant, reviews);
      reviews.then(data => {
        self.restaurant.reviews = data
        console.log('is_favorite? ',self.restaurant);
        is_favorite = self.restaurant.is_favorite
        toggleAnimation() 
        
        if (!restaurant) {
          console.error(error);
          return;
        }
        fillRestaurantHTML();
        callback(null, restaurant)
      })
    });
  }
}


/**
 * Create restaurant HTML and add it to the webpage
 */
const fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img'
  image.alt = restaurant.name;
  image.srcset=`${DBHelper.imageUrlForRestaurant(restaurant,'360w')}.jpg,
                ${DBHelper.imageUrlForRestaurant(restaurant,'480w')}.jpg,
                ${DBHelper.imageUrlForRestaurant(restaurant,'800w')}.jpg`

  image.sizes = `(max-width: 320px) 280px,
  (max-width: 480px) 440px,
  800px`
  image.src = DBHelper.imageUrlForRestaurant(restaurant, '800w');

  console.log(DBHelper.imageUrlForRestaurant(restaurant, '800w'));

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews

  // fetch reviews and appendit to the restaurant
    fillReviewsHTML();
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
const fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */

const add_review = document.createElement('button')

const fillReviewsHTML = (reviews = self.restaurant.reviews) => {
  
  
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h2');
  title.innerHTML = 'Reviews';
  
  container.appendChild(title);

  add_review.id = 'open-review-form'
  add_review.innerText = 'Add your own!'

  container.appendChild(add_review)

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
}

/**
 * Create review HTML and add it to the webpage.
 */
const createReviewHTML = (review) => {
  const li = document.createElement('li');
  const name = document.createElement('p');
  name.innerHTML = review.name;
  li.appendChild(name);

  const date = document.createElement('p');
  var review_date = new Date(review.updatedAt);
  const day = review_date.getDate()
  const month = review_date.getMonth()
  const year = review_date.getFullYear()
  
  
  date.innerHTML = `${day}/${month}/${year}`;
  li.appendChild(date);

  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  rating.id = 'rating';
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  comments.id = 'rating-content';
  li.appendChild(comments);

  return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
const fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
const getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

'use strict';
// toggle favourite
let togglefavorite = document.getElementById('toggle-favourite')


togglefavorite.onclick = function(event) {
    const rest_id = parseInt(getParameterByName('id'));
    
    is_favorite = !is_favorite

    putData(`http://localhost:1337/restaurants/${rest_id}`, { is_favorite: is_favorite })
        .then(updateIDBRestFavorite(rest_id, is_favorite))
        .catch(updateIDBRestFavorite(rest_id, is_favorite))
        
    // toggle value`
    toggleAnimation()
}
/**
 * update restaurant.is_favorite in idb
 * @param {*} rest_id 
 * @param {*} is_favorite 
 */
function updateIDBRestFavorite(rest_id,is_favorite) {
    restDB.then(db => {
        const tx = db.transaction('restaurants', 'readwrite');
        tx.objectStore('restaurants').iterateCursor(cursor => {
            if (!cursor) return;

            if (cursor.value.id == rest_id) {

                let new_value = cursor.value
                new_value.is_favorite = is_favorite
                cursor.update(new_value)
            }
            cursor.continue();
        });
        tx.complete.then(() => console.log('done'));
    })
}

function toggleAnimation() {
    if (is_favorite) {
        document.getElementById('is-favorite-message').innerText = 'Remove from favorites!'
    } else {
        document.getElementById('is-favorite-message').innerText = 'Add to favorites!     '
    }
    if (is_favorite) {
        console.log('checked true');

        togglefavorite.checked = true;
    } else {
        console.log('checked false');
        togglefavorite.checked = false;
    }
}
toggleAnimation()

// Modal behavior
let openModalBtn = document.getElementById('open-review-form');
let closeModalBtn = document.getElementById('close-review-form');
let modal = document.getElementById('modal')

add_review.onclick = function () {
        let modal = document.getElementById('modal');
        console.log('open modal');
    
        modal.style.display = "block"
    }

closeModalBtn.onclick = function () {
    let modal = document.getElementById('modal');
    console.log('close modal');

    modal.style.display = "none"
}

window.onclick = function (event) {
    if (event.target == modal) {
        modal.style.display = "none";
    }

}

// TODO: postDATA and putDATA should add to the serviceworker quee for background sync

const postData = (url = ``, data = {}) => {
    // Default options are marked with *
    return fetch(url, {
        method: "POST", // *GET, POST, PUT, DELETE, etc.
        mode: "cors", // no-cors, cors, *same-origin
        cache: "reload", // *default, no-cache, reload, force-cache, only-if-cached
        // credentials: "same-origin", // include, same-origin, *omit
        headers: {
            "Content-Type": "application/json; charset=utf-8",
            // "Content-Type": "application/x-www-form-urlencoded",
        },
        // redirect: "follow", // manual, *follow, error
        // referrer: "no-referrer", // no-referrer, *client
        body: JSON.stringify(data), // body data type must match "Content-Type" header
    })
        .then(response => response.json()) // parses response to JSON
        .catch(error => console.error(`Fetch Error =\n`, error));
};
const putData = (url = ``, data = {}) => {
    // Default options are marked with *
    return fetch(url, {
        method: "POST", // *GET, POST, PUT, DELETE, etc.
        mode: "cors", // no-cors, cors, *same-origin
        cache: "reload", // *default, no-cache, reload, force-cache, only-if-cached
        // credentials: "same-origin", // include, same-origin, *omit
        headers: {
            "Content-Type": "application/json; charset=utf-8",
            // "Content-Type": "application/x-www-form-urlencoded",
        },
        // redirect: "follow", // manual, *follow, error
        // referrer: "no-referrer", // no-referrer, *client
        body: JSON.stringify(data), // body data type must match "Content-Type" header
    })
        .then(response => response.json()) // parses response to JSON
        .catch(error => console.error(`Fetch Error =\n`, error));
};

// Review form behavior
let form = document.getElementById('modal')

form.onsubmit = function (event) {
    // prevent default
    event.preventDefault()
    // get restaurant id from url parameter
    const rest_id = parseInt(getParameterByName('id'));
    // get data from modal
    let rating_value = 1
    // form inputs
    const ratings = document.getElementsByName('rating')
    const name = document.getElementsByName('name')[0].value
    const review_text = document.getElementsByName('review')[0].value
    // extract selected rating
    ratings.forEach(rating => {
        if (rating.checked) {
            rating_value = parseInt(rating.value)
        }
        
    });
    
    const data = {
        "restaurant_id": rest_id,
        "name": name,
        "rating": rating_value,
        "comments": review_text
    }
    
    postData(`http://localhost:1337/reviews/`, data)
        .then(data => {
            console.log('data got trough', data)
            const ul = document.getElementById('reviews-list');
            ul.appendChild(createReviewHTML(data));
            // add reviews to the cached idb
            restDB.then(db => {
                const tx = db.transaction('reviews', 'readwrite')
                tx.objectStore('reviews').put(data)
            })

        })
        // JSON from `response.json()` call
        .catch(error => console.error(error));


    modal.style.display = "none"

}

function postReviewtoIDB(data) {
    
}