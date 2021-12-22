"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const https = require("https");
require("dotenv").config();
function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
function absBigInt(value) {
    if (value < 0n) {
        return -value;
    }
    return value;
}
function clearZeroValues(transaction) {
    return BigInt(transaction.value) != 0n;
}
async function getLastBlock() {
    let lastBlock = "";
    let lastResult = "";
    let tries = 0;
    while (!lastBlock && tries < 10) {
        https
            .get("https://api.etherscan.io/api?module=proxy&action=eth_blockNumber", (resp) => {
            let data = "";
            resp.on("data", (chunk) => {
                data += chunk;
            });
            resp.on("end", () => {
                lastResult = JSON.parse(data).result;
                if (!isNaN(JSON.parse(data).result)) {
                    // check if string not "Max rate limit reached...", but a number
                    lastBlock = JSON.parse(data).result;
                }
            });
        })
            .on("error", (err) => {
            console.log("Error from API: " + err.message);
        });
        tries++;
        await delay(1000);
    }
    if (!lastBlock) {
        throw new Error(`Request failed 10 attempts, last result:${lastResult}`);
    }
    return lastBlock;
}
async function getBlockInfo(blockID) {
    let APIResp = {
        status: "0",
        result: {
            transactions: [],
        },
    };
    while ("status" in APIResp || "error" in APIResp) {
        https
            .get(`https://api.etherscan.io/api?module=proxy&action=eth_getBlockByNumber&tag=${blockID}&boolean=true&apikey=${process.env.KEY}`, (resp) => {
            let data = "";
            resp.on("data", (chunk) => {
                data += chunk;
            });
            resp.on("end", () => {
                if (JSON.parse(data).result?.transactions) {
                    // if transactions in response, I guess it's correct one
                    APIResp = JSON.parse(data);
                }
            });
        });
        await delay(1000);
    }
    process.stdout.write("#");
    return APIResp;
}
function handleTransactions(data) {
    const changes = [];
    let filteredTransactions = data.result.transactions.filter(clearZeroValues);
    filteredTransactions.forEach((transaction) => {
        let changePlus = {
            wallet: transaction.to,
            value: BigInt(transaction.value),
        };
        let changeMin = {
            wallet: transaction.from,
            value: -BigInt(transaction.value),
        };
        changes.push(changePlus, changeMin);
    });
    return changes;
}
function groupDuplicates(data) {
    const res = Array.from(data.reduce((m, { wallet, value }) => m.set(wallet, (m.get(wallet) || 0n) + value), new Map()), ([wallet, value]) => ({ wallet, value }));
    return res;
}
async function loopThroughBlocks(lastBlockNum, blocksAmount = 100) {
    const promises = [];
    process.stdout.write(`Getting ${blocksAmount} blocks...\n`);
    for (let i = lastBlockNum; i > lastBlockNum - blocksAmount; i--) {
        promises.push(getBlockInfo(i.toString(16)));
    }
    process.stdout.write(`Waiting promises to settle...\n`);
    const resolvedPromises = await Promise.allSettled(promises);
    process.stdout.write("\n");
    const blocks = await Promise.all(resolvedPromises
        .filter(({ status }) => status === "fulfilled")
        .map((p) => p.value));
    process.stdout.write(`Succcesed blocks: ${blocks.length}\n`);
    return blocks;
}
function findMax(data) {
    let stringifiedWallet = { error: "Not found" };
    let maxWallet;
    if (data.length > 0) {
        maxWallet = data.reduce((prev, current) => absBigInt(prev.value) > absBigInt(current.value) ? prev : current);
        stringifiedWallet = {
            ...maxWallet,
            value: maxWallet.value.toString(16),
        };
    }
    return stringifiedWallet;
}
function startAPI(maxWallet) {
    const app = express();
    const port = process.env.PORT || 5000;
    app.get("/", (_request, response) => {
        response.send({ biggestChange: maxWallet });
    });
    app.listen(port, () => process.stdout.write(`Running on port ${port}\nhttp://localhost:${port}/\n`));
}
function main() {
    !process.env.KEY
        ? console.log("KEY not found in .env")
        : console.log("Found KEY in .env");
    const lastBlockPromise = getLastBlock();
    lastBlockPromise.then((lastBlock) => {
        process.stdout.write(`Found last block: ${lastBlock}\n`);
        const acrossBlocksTransactions = [];
        loopThroughBlocks(parseInt(lastBlock)).then((blocks) => {
            process.stdout.write("Searching most changed...\n");
            blocks.forEach((block) => {
                acrossBlocksTransactions.push(...handleTransactions(block));
            });
            startAPI(findMax(groupDuplicates(acrossBlocksTransactions)));
        });
    });
}
main();
