"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearZeroValues = exports.absBigInt = exports.delay = void 0;
function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
exports.delay = delay;
function absBigInt(value) {
    if (value < 0n) {
        return -value;
    }
    return value;
}
exports.absBigInt = absBigInt;
function clearZeroValues(transaction) {
    return BigInt(transaction.value) != 0n;
}
exports.clearZeroValues = clearZeroValues;
