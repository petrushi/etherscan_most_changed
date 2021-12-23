import { Transaction } from "./interfaces";
export function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function absBigInt(value: bigint) {
  if (value < 0n) {
    return -value;
  }
  return value;
}

export function clearZeroValues(transaction: Transaction): boolean {
  return BigInt(transaction.value) != 0n;
}
