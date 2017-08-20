"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var realisticStructuredClone = require("realistic-structured-clone"); // tslint:disable-line no-var-requires
var structuredClone = function (input) {
    try {
        return realisticStructuredClone(input);
    }
    catch (err) {
        // throw new DataCloneError();
        return input;
    }
};
exports.default = structuredClone;
