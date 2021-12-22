import * as express from "express";
import * as https from "https";
require("dotenv").config();

interface PromiseFulfilledResult<T> {
  status: "fulfilled";
  value: T;
}
interface Transaction {
  from: string;
  to: string;
  value: string;
}
interface Result {
  transactions: Transaction[];
}
interface EtherResponse {
  status?: string;
  error?: any;
  result: Result;
}
interface WalletChange {
  wallet: string;
  value: bigint;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function absBigInt(value: bigint) {
  if (value < 0n) {
    return -value;
  }
  return value;
}

function clearZeroValues(transaction: Transaction): boolean {
  return BigInt(transaction.value) != 0n;
}

async function getLastBlock(): Promise<string> {
  let lastBlock: string = "";
  let lastResult: string = "";
  let tries: number = 0;
  while (!lastBlock && tries < 10) {
    https
      .get(
        "https://api.etherscan.io/api?module=proxy&action=eth_blockNumber",
        (resp) => {
          let data: string = "";

          resp.on("data", (chunk) => {
            data += chunk;
          });

          resp.on("end", () => {
            lastResult = JSON.parse(data).result; // save last result to show in case of error
            if (!isNaN(JSON.parse(data).result)) {
              // check if string not "Max rate limit reached...", but a number
              lastBlock = JSON.parse(data).result;
            }
          });
        }
      )
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

async function getBlockInfo(blockID: string) {
  let APIResp: EtherResponse = {
    status: "0",
    result: {
      transactions: [],
    },
  };
  while ("status" in APIResp || "error" in APIResp) {
    https
      .get(
        `https://api.etherscan.io/api?module=proxy&action=eth_getBlockByNumber&tag=${blockID}&boolean=true&apikey=${process.env.KEY}`,
        (resp) => {
          let data: string = "";

          resp.on("data", (chunk) => {
            data += chunk;
          });

          resp.on("end", () => {
            if (JSON.parse(data).result?.transactions) {
              // if transactions in response, I guess it's correct one
              APIResp = JSON.parse(data);
            }
          });
        }
      )
      .on("error", (_err) => {
        //  process.stdout.write(`\nError from API: ${err.message} . Making requests still.\n`);
      });
    await delay(1000);
  }
  process.stdout.write("#");
  return APIResp;
}

function handleTransactions(data: EtherResponse): WalletChange[] {
  const changes: WalletChange[] = [];

  let filteredTransactions: Transaction[] =
    data.result.transactions.filter(clearZeroValues);

  filteredTransactions.forEach((transaction) => {
    let changePlus: WalletChange = {
      wallet: transaction.to,
      value: BigInt(transaction.value),
    };
    let changeMin: WalletChange = {
      wallet: transaction.from,
      value: -BigInt(transaction.value),
    };
    changes.push(changePlus, changeMin);
  });
  return changes;
}

function groupDuplicates(data: WalletChange[]): WalletChange[] {
  const res = Array.from(
    data.reduce(
      (m, { wallet, value }) => m.set(wallet, (m.get(wallet) || 0n) + value),
      new Map()
    ),
    ([wallet, value]) => ({ wallet, value })
  );
  return res;
}

async function loopThroughBlocks(
  lastBlockNum: number,
  blocksAmount: number = 100
): Promise<EtherResponse[]> {
  const promises: Promise<EtherResponse>[] = [];
  process.stdout.write(`Getting ${blocksAmount} blocks...\n`);
  for (let i = lastBlockNum; i > lastBlockNum - blocksAmount; i--) {
    promises.push(getBlockInfo(i.toString(16)));
  }
  process.stdout.write(`Waiting promises to settle...\n`);

  const resolvedPromises = await Promise.allSettled(promises);
  process.stdout.write("\n");
  const blocks = await Promise.all(
    resolvedPromises
      .filter(({ status }) => status === "fulfilled")
      .map((p) => (p as PromiseFulfilledResult<EtherResponse>).value)
  );
  process.stdout.write(`Succcesed blocks: ${blocks.length}\n`);
  return blocks;
}

function findMax(data: WalletChange[]): object {
  let stringifiedWallet: object = { error: "Not found" };
  let maxWallet: WalletChange;
  if (data.length > 0) {
    maxWallet = data.reduce((prev, current) =>
      absBigInt(prev.value) > absBigInt(current.value) ? prev : current
    );
    stringifiedWallet = {
      ...maxWallet,
      value: maxWallet.value.toString(16),
    };
  }
  return stringifiedWallet;
}

function startAPI(maxWallet: object | string): void {
  const app = express();
  const port = process.env.PORT || 5000;
  app.get("/", (_request, response) => {
    response.send({ biggestChange: maxWallet });
  });
  app.listen(port, () =>
    process.stdout.write(`Running on port ${port}\nhttp://localhost:${port}/\n`)
  );
}

function main() {
  !process.env.KEY
    ? console.log("KEY not found in .env")
    : console.log("Found KEY in .env");

  const lastBlockPromise: Promise<string> = getLastBlock();
  lastBlockPromise.then((lastBlock) => {
    process.stdout.write(`Found last block: ${lastBlock}\n`);
    const acrossBlocksTransactions: WalletChange[] = [];

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
