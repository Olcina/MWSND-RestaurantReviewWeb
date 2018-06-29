var express = require('express')
var app = express()
var path = require('path')

// root page
app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname +'/index.html'));
})

app.get('/db-test', (req,res) => {
    res.sendFile(path.join(__dirname + '/test.html'))
})



// serving all files trought static file
app.use(express.static(__dirname))
app.listen(8000)

console.log("Restaurant app running at port 8000");
