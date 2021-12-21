import * as express from "express";
import * as https from "https";
import * as lodash from "lodash";
require("dotenv").config();

interface PromiseFulfilledResult<T> {
  status: "fulfilled";
  value: T;
}

interface PromiseRejectedResult {
  status: "rejected";
  reason: any;
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
  change: number;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function clearZeroValues(transaction: Transaction): boolean {
  return parseInt(transaction.value) != 0;
}

async function getLastBlock(): Promise<string> {
  let lastBlock: string = "";
  let lastResult: string = "";
  let tries: number = 0;
  while (!lastBlock && tries < 5) {
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
    throw new Error(`Request failed 5 attempts, last result:${lastResult}`);
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
            // if (JSON.parse(data).status) {
            //   console.log(JSON.parse(data).result);
            // }
            if (JSON.parse(data).result?.transactions) {
              // if transactions in response, I guess it's correct one
              APIResp = JSON.parse(data);
            }
          });
        }
      )
      .on("error", (err) => {
        console.log("Error from API: " + err.message);
      });
    await delay(1000);
  }
  process.stdout.write("#");
  return APIResp;
}

function handleTransactions(data: EtherResponse): WalletChange[] {
  let changes: WalletChange[] = [];

  let filteredTransactions: Transaction[] =
    data.result.transactions.filter(clearZeroValues);

  filteredTransactions.forEach((transaction) => {
    let changePlus: WalletChange = {
      wallet: transaction.to,
      change: parseInt(transaction.value),
    };
    let changeMin: WalletChange = {
      wallet: transaction.from,
      change: -parseInt(transaction.value),
    };
    changes.push(changePlus, changeMin);
  });
  return changes;
}

function groupDuplicates(data: WalletChange[]): WalletChange[] {
  const unique = lodash.groupBy(data, (tr: WalletChange) => tr.wallet);
  const result = Object.keys(unique).map((key) => {
    const first = unique[key][0];
    return {
      ...first,
      change: lodash.sumBy(unique[key], (tr: WalletChange) => tr.change),
    };
  });
  return result;
}

function startAPI(data: WalletChange[]) {
  const max = Math.max.apply(
    Math,
    data.map(function (o) {
      return Math.abs(o.change);
    })
  );
  var obj = data.find(function (o) {
    return Math.abs(o.change) == max;
  });
  const app = express();
  const port = process.env.PORT || 5000;
  app.get("/", (request, response) => {
    response.send({ biggestChange: obj });
  });
  app.listen(port, () =>
    process.stdout.write(`Running on port ${port}\nhttp://localhost:5000/\n`)
  );
}

async function loopThroughBlocks(
  lastBlockNum: number,
  blocksAmount: number = 100
): Promise<EtherResponse[]> {
  let promises: Promise<EtherResponse>[] = [];
  process.stdout.write(`Getting ${blocksAmount} blocks...\n`);
  for (let i = lastBlockNum; i > lastBlockNum - blocksAmount; i--) {
    promises.push(getBlockInfo(i.toString(16)));
  }
  process.stdout.write(`Waiting promises to settle...\n`);

  const resolvedPromises = await Promise.allSettled(promises);
  process.stdout.write("\n");
  let blocks = await Promise.all(
    resolvedPromises
      .filter(({ status }) => status === "fulfilled")
      .map((p) => (p as PromiseFulfilledResult<EtherResponse>).value)
  );
  process.stdout.write(`Succcesed blocks: ${resolvedPromises.length}\n`);

  return blocks;
}

function main() {
  const lastBlockPromise: Promise<string> = getLastBlock();
  lastBlockPromise.then((lastBlock) => {
    process.stdout.write(`Found last block: ${lastBlock}\n`);
    const lastBlockNum: number = parseInt(lastBlock);
    let acrossBlocksTransactions: WalletChange[] = [];

    loopThroughBlocks(lastBlockNum).then((blocks) => {
      process.stdout.write("Searching most changed...\n");
      blocks.forEach((block) => {
        acrossBlocksTransactions = acrossBlocksTransactions.concat(
          handleTransactions(block)
        );
      });
      startAPI(groupDuplicates(acrossBlocksTransactions));
    });
  });
}

main();
