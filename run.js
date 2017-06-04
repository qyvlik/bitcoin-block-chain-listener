const BLT = require("./bitcoin-block-chain-listener")
let bitcoin = new BLT();

bitcoin.connect().catch(function (e) {
    console.error('listener connect error', e);
});

bitcoin.events.on('tx', function (tx) {
    console.log("on tx:", tx.txid);
    // bitcoin.getTx(tx.txid).then(function (txObj) {
    //     let txId = txObj.txid;
    //     let vin = txObj.vin;
    //     let vout = txObj.vout;
    //     console.log('getTx txid', txId, 'vin length:', vin.length, 'vout length:', vout.length);
    // }).catch(function (e) {
    //     console.error(`get tx txId:${tx.txid} fail : error: ${e}`);
    // });
    // console.log("typeof tx:", typeof tx);
    // console.log("keys of tx:", Object.keys(tx));
    // console.log('txid:', tx.txid);
    // console.log('vout:', tx.vout);
    // console.log('vin:', tx.vin);
});

bitcoin.events.on('block', function (block) {
    console.log("block str:", JSON.stringify(block));
});

console.log('listen run...');