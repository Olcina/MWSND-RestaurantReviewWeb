'use strict';
// toggle favourite
let togglefavorite = document.getElementById('toggle-favourite')
// let is_favorite = false;
togglefavorite.onclick = function(event) {
    const rest_id = parseInt(getParameterByName('id'));
    if(is_favorite) {
        putData(`http://localhost:1337/restaurants/${rest_id}`, { is_favorite: is_favorite }).then(
            response =>
            // update the restaurant in the idb
            {
                restDB.then(db => {
                    const tx = db.transaction('restaurants','readwrite');
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
        )
        
    } else {
        // restDB.then(db => {
        //     let tx = db.transaction('restaurants');
        //     let restaurantsStore = tx.objectStore('restaurants');


        //     return restaurantsStore.get(rest_id)

        // }).then(restaurant => console.log('restaurant from idb on toggle', restaurant))
        putData(`http://localhost:1337/restaurants/${rest_id}`, {is_favorite: is_favorite}).then(
            response =>
            // update the restaurant in the idb
            {
                restDB.then(db => {
                    const tx = db.transaction('restaurants','readwrite');
                    tx.objectStore('restaurants').iterateCursor(cursor => {
                        if (!cursor) return;
                        
                        if(cursor.value.id == rest_id) {
                            
                            let new_value = cursor.value
                            new_value.is_favorite = is_favorite
                            cursor.update(new_value)
                        }
                        cursor.continue();
                    });
                    tx.complete.then(() => console.log('done'));
                })
            }
        )

    }
    // toggle value`
    is_favorite = !is_favorite
    toggleAnimation()
}

function toggleAnimation() {
    if (is_favorite) {
        togglefavorite.style.backgroundColor = 'green';
        document.getElementById('is-favorite-message').innerText = 'Remove from favorites!'
    } else {
        togglefavorite.style.backgroundColor = 'red'
        document.getElementById('is-favorite-message').innerText = 'Add to favorites!     '
    }
}

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