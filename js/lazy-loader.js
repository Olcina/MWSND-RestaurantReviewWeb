
// LAZY LOADER
let observer;

function lazyload() {
  let lazyImages = document.querySelectorAll('.lazy')

  console.log('MY LAZY LOAD IMAGES', lazyImages);

  const config = {
    // If the image gets within 50px in the Y axis, start the download.
    rootMargin: '10px 0px',
    threshold: 0.01
  };

  // The observer for the images on the page
  observer = new IntersectionObserver(onIntersection, config);
  lazyImages.forEach(image => {
    console.log(image);

    observer.observe(image);
  });

}



function onIntersection(entries) {
  // Loop through the entries
  entries.forEach(entry => {
    // Are we in viewport?
    if (entry.intersectionRatio > 0) {

      // Stop watching and load the image
      observer.unobserve(entry.target);
      preloadImage(entry.target);
    }
  });
}


function preloadImage(img) {
  // Prevent this from being lazy loaded a second time.
  console.log('PRELOADNIG', img);

  img.classList.add('restaurant-img');
  img.srcset = img.dataset.srcset;
  img.src = img.dataset.src;
  img.classList.add('fade-in');
}