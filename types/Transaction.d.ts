import { Address, TonClient, TonTransaction } from "ton";
export declare type TransactionId = {
    lt: string;
    hash: string;
};
export declare function lastOrNull(tonClient: TonClient, address: Address): Promise<TonTransaction | null>;
export declare function last(tonClient: TonClient, address: Address): Promise<TonTransaction>;
export declare function getAllSince(tonClient: TonClient, address: Address, chunkSize: number, sinceLt?: number | string, // exclusive
untilId?: TransactionId, inclusive?: boolean): Promise<TonTransaction[]>;
