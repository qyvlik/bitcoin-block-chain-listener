const Socket = require('blockchain.info/Socket');

const mySocket = new Socket();

mySocket.onTransaction(function (txObj) {
    console.info('onTransaction: ', txObj);
});

mySocket.onBlock(function (blockObj) {
    console.info('onBlock: ', blockObj);
});
