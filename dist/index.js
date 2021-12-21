"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var express = require("express");
var https = require("https");
var lodash = require("lodash");
require("dotenv").config();
function delay(ms) {
    return new Promise(function (resolve) { return setTimeout(resolve, ms); });
}
function clearZeroValues(transaction) {
    return parseInt(transaction.value) != 0;
}
function getLastBlock() {
    return __awaiter(this, void 0, void 0, function () {
        var lastBlock, lastResult, tries;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    lastBlock = "";
                    lastResult = "";
                    tries = 0;
                    _a.label = 1;
                case 1:
                    if (!(!lastBlock && tries < 5)) return [3 /*break*/, 3];
                    https
                        .get("https://api.etherscan.io/api?module=proxy&action=eth_blockNumber", function (resp) {
                        var data = "";
                        resp.on("data", function (chunk) {
                            data += chunk;
                        });
                        resp.on("end", function () {
                            lastResult = JSON.parse(data).result; // save last result to show in case of error
                            if (!isNaN(JSON.parse(data).result)) {
                                // check if string not "Max rate limit reached...", but a number
                                lastBlock = JSON.parse(data).result;
                            }
                        });
                    })
                        .on("error", function (err) {
                        console.log("Error from API: " + err.message);
                    });
                    tries++;
                    return [4 /*yield*/, delay(1000)];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 1];
                case 3:
                    if (!lastBlock) {
                        throw new Error("Request failed 5 attempts, last result:".concat(lastResult));
                    }
                    return [2 /*return*/, lastBlock];
            }
        });
    });
}
function getBlockInfo(blockID) {
    return __awaiter(this, void 0, void 0, function () {
        var APIResp;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    APIResp = {
                        status: "0",
                        result: {
                            transactions: []
                        }
                    };
                    _a.label = 1;
                case 1:
                    if (!("status" in APIResp || "error" in APIResp)) return [3 /*break*/, 3];
                    https
                        .get("https://api.etherscan.io/api?module=proxy&action=eth_getBlockByNumber&tag=".concat(blockID, "&boolean=true&apikey=").concat(process.env.KEY), function (resp) {
                        var data = "";
                        resp.on("data", function (chunk) {
                            data += chunk;
                        });
                        resp.on("end", function () {
                            var _a;
                            // if (JSON.parse(data).status) {
                            //   console.log(JSON.parse(data).result);
                            // }
                            if ((_a = JSON.parse(data).result) === null || _a === void 0 ? void 0 : _a.transactions) {
                                // if transactions in response, I guess it's correct one
                                APIResp = JSON.parse(data);
                            }
                        });
                    })
                        .on("error", function (err) {
                        console.log("Error from API: " + err.message);
                    });
                    return [4 /*yield*/, delay(1000)];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 1];
                case 3:
                    process.stdout.write("#");
                    return [2 /*return*/, APIResp];
            }
        });
    });
}
function handleTransactions(data) {
    var changes = [];
    var filteredTransactions = data.result.transactions.filter(clearZeroValues);
    filteredTransactions.forEach(function (transaction) {
        var changePlus = {
            wallet: transaction.to,
            change: parseInt(transaction.value)
        };
        var changeMin = {
            wallet: transaction.from,
            change: -parseInt(transaction.value)
        };
        changes.push(changePlus, changeMin);
    });
    return changes;
}
function groupDuplicates(data) {
    var unique = lodash.groupBy(data, function (tr) { return tr.wallet; });
    var result = Object.keys(unique).map(function (key) {
        var first = unique[key][0];
        return __assign(__assign({}, first), { change: lodash.sumBy(unique[key], function (tr) { return tr.change; }) });
    });
    return result;
}
function startAPI(data) {
    var max = Math.max.apply(Math, data.map(function (o) {
        return Math.abs(o.change);
    }));
    var obj = data.find(function (o) {
        return Math.abs(o.change) == max;
    });
    var app = express();
    var port = process.env.PORT || 5000;
    app.get("/", function (request, response) {
        response.send({ biggestChange: obj || 'Not found' });
    });
    app.listen(port, function () {
        return process.stdout.write("Running on port ".concat(port, "\nhttp://localhost:5000/\n"));
    });
}
function loopThroughBlocks(lastBlockNum, blocksAmount) {
    if (blocksAmount === void 0) { blocksAmount = 100; }
    return __awaiter(this, void 0, void 0, function () {
        var promises, i, resolvedPromises, blocks;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    promises = [];
                    process.stdout.write("Getting ".concat(blocksAmount, " blocks...\n"));
                    for (i = lastBlockNum; i > lastBlockNum - blocksAmount; i--) {
                        promises.push(getBlockInfo(i.toString(16)));
                    }
                    process.stdout.write("Waiting promises to settle...\n");
                    return [4 /*yield*/, Promise.allSettled(promises)];
                case 1:
                    resolvedPromises = _a.sent();
                    process.stdout.write("\n");
                    return [4 /*yield*/, Promise.all(resolvedPromises
                            .filter(function (_a) {
                            var status = _a.status;
                            return status === "fulfilled";
                        })
                            .map(function (p) { return p.value; }))];
                case 2:
                    blocks = _a.sent();
                    process.stdout.write("Succcesed blocks: ".concat(resolvedPromises.length, "\n"));
                    return [2 /*return*/, blocks];
            }
        });
    });
}
function main() {
    var lastBlockPromise = getLastBlock();
    lastBlockPromise.then(function (lastBlock) {
        process.stdout.write("Found last block: ".concat(lastBlock, "\n"));
        var lastBlockNum = parseInt(lastBlock);
        var acrossBlocksTransactions = [];
        loopThroughBlocks(lastBlockNum).then(function (blocks) {
            process.stdout.write("Searching most changed...\n");
            blocks.forEach(function (block) {
                acrossBlocksTransactions = acrossBlocksTransactions.concat(handleTransactions(block));
            });
            startAPI(groupDuplicates(acrossBlocksTransactions));
        });
    });
}
main();
