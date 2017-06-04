const BitcoinBlockChainListener = require('./bitcoin-block-chain-listener');

let listener = new BitcoinBlockChainListener();
listener.connect();

listener.on('tx', function (tx) {
    console.log('tx', tx.txid);
});

listener.on('block', function (block) {
    console.log('block', block.hash);
});