// [WebSocket API Real-Time blockchain data](https://blockchain.info/api/api_websocket)
const Socket = require('blockchain.info/Socket');
const EventEmitter = require('events');

class BitcoinBlockChainListener extends EventEmitter {

    connect() {
        this.blockChainInfo = new Socket();
        let self = this;

        this.blockChainInfo.onBlock(function (blockObj) {
            self.emit('block', blockObj);
        });

        this.blockChainInfo.onTransaction(function (txObj) {
            let txHashObj = self.handleTx(txObj);
            self.emit('tx', txHashObj);
        });
    }

    handleTx(txObj) {
        let inputs = txObj['inputs'];
        let outputs = txObj['out'];
        let vin = [];
        let vout = [];
        let inputsAmount = 0;
        let outputAmount = 0;
        let addressSet = new Set();

        for (let inputIter in inputs) {
            let input = inputs[inputIter]['prev_out'];
            let vinItem = {};
            let val = input['value'];
            let addr = input['addr'];
            vinItem[addr] = val;
            inputsAmount += val;
            vin.push(vinItem);
            addressSet.add(addr);
        }

        for (let outputIter in outputs) {
            let output = outputs[outputIter];
            let outItem = {};
            let val = output['value'];
            let addr = output['addr'];
            outItem[addr] = val;
            outputAmount += val;
            vout.push(outItem);
            addressSet.add(addr);
        }

        let txHashObj = {
            'txid': txObj['hash'],
            'txAt': txObj['time'],
            'vout': vout,
            'vin': vin,
            'fee': inputsAmount - outputAmount,
            'val': outputAmount,
            'addr': addressSet
        };
        return txHashObj;
    }
}

module.exports = BitcoinBlockChainListener;