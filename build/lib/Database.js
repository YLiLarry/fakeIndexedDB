"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#dfn-database
var Database = (function () {
    function Database(name, version) {
        this.deletePending = false;
        this.transactions = [];
        this.rawObjectStores = new Map();
        this.connections = [];
        this.name = name;
        this.version = version;
        this.processTransactions = this.processTransactions.bind(this);
    }
    Database.prototype.processTransactions = function () {
        var _this = this;
        setImmediate(function () {
            var anyRunning = _this.transactions.some(function (transaction) {
                return transaction._started && !transaction._finished;
            });
            if (!anyRunning) {
                var next = _this.transactions.find(function (transaction) {
                    return !transaction._started && !transaction._finished;
                });
                if (next) {
                    next._start();
                    next.addEventListener("complete", _this.processTransactions);
                    next.addEventListener("abort", _this.processTransactions);
                }
            }
        });
    };
    return Database;
}());
exports.default = Database;
