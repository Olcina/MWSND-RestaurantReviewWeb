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

// HELPERS: postDATA and putDATA utilities

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

    // check connectivity
    if (navigator.onLine) {
        console.log('online');
    } else {
        console.log('offline');
    }
    
        restDB.then(db => {
            const tx = db.transaction('reviews', 'readonly');
            const store = tx.objectStore('reviews');
            return store.count()
        }).then(count => {
            console.log('reviews offline count:',count);
            
            restDB.then( db => {
                const creationDate = Date.now()
                data.id = count+1;
                data.createdAt = creationDate;
                data.updatedAt = creationDate;

                console.log('data with id',data);
                
                const tx = db.transaction('reviews', 'readwrite');
                const store = tx.objectStore('reviews');
                // store the new review in the idb
                store.put(data)
                // append the review to the html
                const ul = document.getElementById('reviews-list');
                ul.appendChild(createReviewHTML(data));
                
            })
            }).then(
                // send a post request to the sw queue to update the server when online
                postData(`http://localhost:1337/reviews/`, data))
    
    

    modal.style.display = "none"

}
