// code from bitcoin-live-transactions
const io = require('socket.io-client');
const debug = require('debug')('blt');
const txdebug = require('debug')('blt:tx');
const hashdebug = require('debug')('blt:hash');
const blockdebug = require('debug')('blt:block');
const blockchaindebug = require('debug')('blt:blockchain');
const request = require('request');

const EventEmitter = require('events').EventEmitter;

function getRandomNum(min, max) {
    var range = max - min;
    var rand = Math.random();
    return (min + Math.round(rand * range));
}

module.exports = function () {
    this.insight_servers = [
        "https://insight.bitpay.com/",
        "https://www.localbitcoinschain.com/",
        "https://search.bitaccess.co/",
        "https://chain.bitcoinworld.com/",
        "https://blockexplorer.com/"
    ];

    this.insight_apis_servers = [
        "https://insight.bitpay.com/api/",
        "https://www.localbitcoinschain.com/api/",
        "https://search.bitaccess.co/insight-api/",
        "https://chain.bitcoinworld.com/insight-api/",
        "https://blockexplorer.com/api/"
    ];

    function getApiUrl() {
        let i = getRandomNum(0, self.insight_apis_servers.length);
        let apiUrl = self.insight_apis_servers[i];
        // console.info('getApiUrl index:', i, ", url:", apiUrl);
        return apiUrl;
    }

    this.connected = false;
    self = this;
    this.events = new EventEmitter();

    this.getTx = function (txid) {
        return new Promise(function (Success, Reject) {
            let apiUrl = getApiUrl();
            request(apiUrl + 'tx/' + txid, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    blockchaindebug('success :)')
                    var resObj = JSON.parse(body);
                    Success(resObj);
                } else {
                    // console.error('getTx fail: url:', apiUrl, ", txid:", txid, "error:", error, body);
                    blockchaindebug('reject');
                    Reject(response.statusCode);
                }
            });
        });
    };

    this.getBlock = function (hash) {
        return new Promise(function (Success, Reject) {
            let apiUrl = getApiUrl();
            request(apiUrl + 'block/' + hash, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    blockchaindebug('success :)')
                    var resObj = JSON.parse(body);
                    Success(resObj);
                } else {
                    blockchaindebug('reject');
                    Reject(response.statusCode);
                }
            });
        });
    };

    this.getBalance = function (address) {
        return new Promise(function (Success, Reject) {
            self.getAddress(address).then(function (result) {
                Success(result.balance);
            }).catch(Reject);
        })
    };

    this.getTxs4Address = function (address) {
        var result = {};
        let apiUrl = getApiUrl();
        blockchaindebug('Getting txs for address', address, 'url:', apiUrl + 'txs/?address=' + address);
        return new Promise(function (Success, Reject) {
            result.address = address;
            result.in = 0;
            result.out = 0;
            result.curr = "bits(uBTC)";
            request(apiUrl + 'txs/?address=' + address, function (error, response, body) {
                if (error || response.statusCode != 200) {
                    blockchaindebug('reject');
                    Reject(response.statusCode);
                    return;
                }
                blockchaindebug('success :)')

                let transaction_json = JSON.parse(body);
                // console.log('transaction_json')
                transaction_json.txs.forEach(function (each_tx) {
                    each_tx.vout.forEach(function (each_vout) {
                        each_vout.scriptPubKey.addresses.forEach(function (outaddress) {
                            // console.log('checking', outaddress)
                            if (outaddress === address) {
                                // console.log('adding!', each_vout.value)
                                result.in = result.in + each_vout.value * 1000000
                            }
                        });
                    });
                    each_tx.vin.forEach(function (each_vin) {
                        if (each_vin.addr === address) {
                            // console.log('adding!', each_vout.value)
                            result.out = result.out + each_vin.value * 1000000
                        }
                    });
                });
                result.balance = result.in - result.out;
                result.txs = transaction_json.txs.length;
                Success({txs: JSON.parse(body), balance: result});
            });
        });
    };

    this.connect = function () {
        return new Promise(function (Success, Reject) {
            if (self.connected === true) {
                return;
            }

            self.url = self.insight_servers.shift();

            if (typeof self.url === 'undefined') {
                Reject('Cannot reach any bitcoin insight server... no bitcoin transactions are being received.');
                return;
            }

            self.socket = io(self.url);

            setTimeout(function () {
                if (self.connected === false) {
                    debug('Could not connect, trying again...');
                    self.socket.disconnect();
                    self.connect();
                }
            }, 5000);

            self.socket.on('connect', function () {
                Success()
                self.connected = true;
                self.socket.emit('subscribe', 'inv');
                self.events.emit('connected');
            });

            self.socket.on('tx', function (data) {
                //! [Confusion in TX object received from Web Socket.](https://github.com/bitpay/insight-api/issues/320)
                self.events.emit('tx', data);
                data.vout.forEach(function (each_vout) {
                    hashdebug({
                        address: Object.keys(each_vout)[0],
                        amount: each_vout[Object.keys(each_vout)[0]]
                    });
                    self.events.emit(Object.keys(each_vout)[0], {
                        address: Object.keys(each_vout)[0],
                        amount: each_vout[Object.keys(each_vout)[0]]
                    });
                });
                txdebug("New transaction received: " + JSON.stringify(data));
            });

            self.socket.on('block', function (data) {
                self.events.emit('block', data);
                blockdebug('New block: ' + JSON.stringify(data));
            });

            self.socket.on('event', function (data) {
                debug('event', data);
            });

            self.socket.on('disconnect', function (d) {
                debug('disconnect!', d);
            });

            self.socket.on('error', function (e) {
                debug('error!', e);
            });

        });
    };
};