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
        // cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
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
    // get data from modal
    let formData = new FormData(form);
    const rest_id = getParameterByName('id')
    const name = 'test name'
    const rating = 3
    const review_text = 'test review'

    const data = {
        "restaurant_id": rest_id,
        "name": name,
        "rating": rating,
        "comments": review_text
    }

    postData(`http://localhost:1337/reviews/`, data)
        .then(data => console.log('data got trough', data)) // JSON from `response.json()` call
        .catch(error => console.error(error));

    modal.style.display = "none"

}