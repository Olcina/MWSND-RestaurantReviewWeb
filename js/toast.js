// script from https://www.w3schools.com/howto/howto_js_snackbar.asp

window.addEventListener('offline', function (e) {

    activateToast('toast', 'Connection with the server was lost')

});

window.addEventListener('online', function (e) { 

    activateToast('toast','Connection with the server was restablished')
     
});

function activateToast(html_id, message) {

    var toast = document.getElementById(html_id);

    // Add the "show" class to DIV
    toast.innerText = message
    toast.className = "toast show";

    // After 3 seconds, remove the show class from DIV
    setTimeout(function () { toast.className = toast.className.replace("show", ""); }, 3000);
}