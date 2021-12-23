export interface PromiseFulfilledResult<T> {
  status: "fulfilled";
  value: T;
}
export interface Transaction {
  from: string;
  to: string;
  value: string;
}
export interface Result {
  transactions: Transaction[];
}
export interface EtherResponse {
  status?: string;
  error?: any;
  result: Result;
}
export interface WalletChange {
  wallet: string;
  value: bigint;
}
