import path = require('path');
import express = require('express');

const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static(path.join(__dirname, 'public')));

const PORT = 3000;
http.listen(PORT, () => {
    console.log(`App running on port ${PORT}`);
});
