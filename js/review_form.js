'use strict';

// Modal behavior
let openModalBtn = document.getElementById('open-review-form');
let closeModalBtn = document.getElementById('close-review-form');
let modal = document.getElementById('modal')


openModalBtn.onclick = function () {
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

        }) // JSON from `response.json()` call
        .catch(error => console.error(error));


    modal.style.display = "none"

}