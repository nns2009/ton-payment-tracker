import { Address, TonClient } from "ton";
export declare type TrackingState = {
    lastProcessedLt?: string;
};
export declare type Payment = {
    source: Address;
    amount: number;
    message: string;
};
export declare type PaymentsUpdate = {
    payments: Payment[];
    nextTrackingState: TrackingState;
};
export declare type PaymentReceivedCallback = (paymentsUpdate: PaymentsUpdate) => void;
export declare const defaultTrackingState: TrackingState;
export declare function trackingStateEqual(a: TrackingState, b: TrackingState): boolean;
export declare function makeTrackingState(lastProcessedLt: string): TrackingState;
export declare const testEndpoint = "https://testnet.toncenter.com/api/v2/jsonRPC";
export declare const mainEndpoint = "https://toncenter.com/api/v2/jsonRPC";
export declare class PaymentTracker {
    tonClient: TonClient;
    checkIntervalInSeconds: number;
    chunkSize: number;
    errorRetryDelay: number;
    constructor(params: {
        tonClient?: TonClient;
        testnet?: boolean;
        toncenterApiKey?: string;
        checkIntervalInSeconds?: number;
        chunkSize?: number;
        errorRetryDelay?: number;
    });
    currentTrackingStateOf(address: Address | string): Promise<TrackingState>;
    newPaymentsTo(address: Address | string, trackingState: TrackingState): Promise<PaymentsUpdate>;
    startPaymentTracking(address: Address | string, trackingState: TrackingState, callback: PaymentReceivedCallback): Promise<void>;
}
