const path = require('path');

module.exports = {
    entry: './js/idb.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'idb-bundle.js'
    }
};