// hosts scripts locally for debugging
const fs = require('fs');
const http = require('http');

http.createServer((req, res) => {
    switch(req.url) {
        case '/host':
            res.end(fs.readFileSync('./client/join.js'));
            break;
        case '/join':
            res.end(fs.readFileSync('./client/join.js'));
            break;
    }
}).listen(8080, () => {})