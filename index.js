var express = require('express')
var compression = require('compression')
var app = express()
var path = require('path')

app.use(compression())
// root page
app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname +'/index.html'));
})

app.get('/db-test', (req,res) => {
    res.sendFile(path.join(__dirname + '/test.html'))
})

app.use(express.static(__dirname + '/css'));

// serving all files trought static file
app.use(express.static(__dirname))
app.listen(8000)

console.log("Restaurant app running at port 8000");
