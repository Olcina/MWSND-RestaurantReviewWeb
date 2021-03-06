
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
    return (`dist/images/${quality}-${restaurant.photograph}`);
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
