"use strict";
var __values = (this && this.__values) || function (o) {
    var m = typeof Symbol === "function" && o[Symbol.iterator], i = 0;
    if (m) return m.call(o);
    return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
};
Object.defineProperty(exports, "__esModule", { value: true });
var errors_1 = require("./errors");
var extractKey_1 = require("./extractKey");
var KeyGenerator_1 = require("./KeyGenerator");
var RecordStore_1 = require("./RecordStore");
var structuredClone_1 = require("./structuredClone");
// http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#dfn-object-store
var ObjectStore = (function () {
    function ObjectStore(rawDatabase, name, keyPath, autoIncrement) {
        this.deleted = false;
        this.records = new RecordStore_1.default();
        this.rawIndexes = new Map();
        this.rawDatabase = rawDatabase;
        this.keyGenerator = autoIncrement === true ? new KeyGenerator_1.default() : null;
        this.deleted = false;
        this.name = name;
        this.keyPath = keyPath;
        this.autoIncrement = autoIncrement;
    }
    // http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#dfn-steps-for-retrieving-a-value-from-an-object-store
    ObjectStore.prototype.getKey = function (key) {
        var record = this.records.get(key);
        return record !== undefined ? structuredClone_1.default(record.key) : undefined;
    };
    // http://w3c.github.io/IndexedDB/#retrieve-multiple-keys-from-an-object-store
    ObjectStore.prototype.getAllKeys = function (range, count) {
        if (count === undefined || count === 0) {
            count = Infinity;
        }
        var records = [];
        try {
            for (var _a = __values(this.records.values(range)), _b = _a.next(); !_b.done; _b = _a.next()) {
                var record = _b.value;
                records.push(structuredClone_1.default(record.key));
                if (records.length >= count) {
                    break;
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_b && !_b.done && (_c = _a.return)) _c.call(_a);
            }
            finally { if (e_1) throw e_1.error; }
        }
        return records;
        var e_1, _c;
    };
    // http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#dfn-steps-for-retrieving-a-value-from-an-object-store
    ObjectStore.prototype.getValue = function (key) {
        var record = this.records.get(key);
        return record !== undefined ? structuredClone_1.default(record.value) : undefined;
    };
    // http://w3c.github.io/IndexedDB/#retrieve-multiple-values-from-an-object-store
    ObjectStore.prototype.getAllValues = function (range, count) {
        if (count === undefined || count === 0) {
            count = Infinity;
        }
        var records = [];
        try {
            for (var _a = __values(this.records.values(range)), _b = _a.next(); !_b.done; _b = _a.next()) {
                var record = _b.value;
                records.push(structuredClone_1.default(record.value));
                if (records.length >= count) {
                    break;
                }
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (_b && !_b.done && (_c = _a.return)) _c.call(_a);
            }
            finally { if (e_2) throw e_2.error; }
        }
        return records;
        var e_2, _c;
    };
    // http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#dfn-steps-for-storing-a-record-into-an-object-store
    ObjectStore.prototype.storeRecord = function (newRecord, noOverwrite, rollbackLog) {
        var _this = this;
        if (this.keyPath !== null) {
            var key = extractKey_1.default(this.keyPath, newRecord.value);
            if (key !== undefined) {
                newRecord.key = key;
            }
        }
        if (this.keyGenerator !== null && newRecord.key === undefined) {
            if (rollbackLog) {
                var keyGeneratorBefore_1 = this.keyGenerator.num;
                rollbackLog.push(function () {
                    if (_this.keyGenerator) {
                        _this.keyGenerator.num = keyGeneratorBefore_1;
                    }
                });
            }
            newRecord.key = this.keyGenerator.next();
            // Set in value if keyPath defiend but led to no key
            // http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#dfn-steps-to-assign-a-key-to-a-value-using-a-key-path
            if (this.keyPath !== null) {
                if (Array.isArray(this.keyPath)) {
                    throw new Error("Cannot have an array key path in an object store with a key generator");
                }
                var remainingKeyPath = this.keyPath;
                var object = newRecord.value;
                var identifier = void 0;
                var i = 0; // Just to run the loop at least once
                while (i >= 0) {
                    if (typeof object !== "object") {
                        throw new errors_1.DataError();
                    }
                    i = remainingKeyPath.indexOf(".");
                    if (i >= 0) {
                        identifier = remainingKeyPath.slice(0, i);
                        remainingKeyPath = remainingKeyPath.slice(i + 1);
                        if (!object.hasOwnProperty(identifier)) {
                            object[identifier] = {};
                        }
                        object = object[identifier];
                    }
                }
                identifier = remainingKeyPath;
                object[identifier] = newRecord.key;
            }
        }
        else if (this.keyGenerator !== null && typeof newRecord.key === "number") {
            this.keyGenerator.setIfLarger(newRecord.key);
        }
        var existingRecord = this.records.get(newRecord.key);
        if (existingRecord) {
            if (noOverwrite) {
                throw new errors_1.ConstraintError();
            }
            this.deleteRecord(newRecord.key, rollbackLog);
        }
        this.records.add(newRecord);
        try {
            // Update indexes
            for (var _a = __values(this.rawIndexes.values()), _b = _a.next(); !_b.done; _b = _a.next()) {
                var rawIndex = _b.value;
                if (rawIndex.initialized) {
                    rawIndex.storeRecord(newRecord);
                }
            }
        }
        catch (e_3_1) { e_3 = { error: e_3_1 }; }
        finally {
            try {
                if (_b && !_b.done && (_c = _a.return)) _c.call(_a);
            }
            finally { if (e_3) throw e_3.error; }
        }
        if (rollbackLog) {
            rollbackLog.push(this.deleteRecord.bind(this, newRecord.key));
        }
        return newRecord.key;
        var e_3, _c;
    };
    // http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#dfn-steps-for-deleting-records-from-an-object-store
    ObjectStore.prototype.deleteRecord = function (key, rollbackLog) {
        var deletedRecords = this.records.delete(key);
        if (rollbackLog) {
            try {
                for (var deletedRecords_1 = __values(deletedRecords), deletedRecords_1_1 = deletedRecords_1.next(); !deletedRecords_1_1.done; deletedRecords_1_1 = deletedRecords_1.next()) {
                    var record = deletedRecords_1_1.value;
                    rollbackLog.push(this.storeRecord.bind(this, record, true));
                }
            }
            catch (e_4_1) { e_4 = { error: e_4_1 }; }
            finally {
                try {
                    if (deletedRecords_1_1 && !deletedRecords_1_1.done && (_a = deletedRecords_1.return)) _a.call(deletedRecords_1);
                }
                finally { if (e_4) throw e_4.error; }
            }
        }
        try {
            for (var _b = __values(this.rawIndexes.values()), _c = _b.next(); !_c.done; _c = _b.next()) {
                var rawIndex = _c.value;
                rawIndex.records.deleteByValue(key);
            }
        }
        catch (e_5_1) { e_5 = { error: e_5_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_d = _b.return)) _d.call(_b);
            }
            finally { if (e_5) throw e_5.error; }
        }
        var e_4, _a, e_5, _d;
    };
    // http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#dfn-steps-for-clearing-an-object-store
    ObjectStore.prototype.clear = function (rollbackLog) {
        var deletedRecords = this.records.clear();
        if (rollbackLog) {
            try {
                for (var deletedRecords_2 = __values(deletedRecords), deletedRecords_2_1 = deletedRecords_2.next(); !deletedRecords_2_1.done; deletedRecords_2_1 = deletedRecords_2.next()) {
                    var record = deletedRecords_2_1.value;
                    rollbackLog.push(this.storeRecord.bind(this, record, true));
                }
            }
            catch (e_6_1) { e_6 = { error: e_6_1 }; }
            finally {
                try {
                    if (deletedRecords_2_1 && !deletedRecords_2_1.done && (_a = deletedRecords_2.return)) _a.call(deletedRecords_2);
                }
                finally { if (e_6) throw e_6.error; }
            }
        }
        try {
            for (var _b = __values(this.rawIndexes.values()), _c = _b.next(); !_c.done; _c = _b.next()) {
                var rawIndex = _c.value;
                rawIndex.records.clear();
            }
        }
        catch (e_7_1) { e_7 = { error: e_7_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_d = _b.return)) _d.call(_b);
            }
            finally { if (e_7) throw e_7.error; }
        }
        var e_6, _a, e_7, _d;
    };
    return ObjectStore;
}());
exports.default = ObjectStore;
