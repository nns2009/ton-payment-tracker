import { Address, TonClient } from "ton";
import { addressEqual, sleep } from "./common.js";
import * as Transaction from './Transaction.js';
export const defaultTrackingState = {
    lastProcessedLt: undefined,
};
export function trackingStateEqual(a, b) {
    return a.lastProcessedLt === b.lastProcessedLt;
}
export function makeTrackingState(lastProcessedLt) {
    return { lastProcessedLt };
}
export const testEndpoint = "https://testnet.toncenter.com/api/v2/jsonRPC";
export const mainEndpoint = "https://toncenter.com/api/v2/jsonRPC";
//export const workchain = 0;
export class PaymentTracker {
    tonClient;
    checkIntervalInSeconds;
    chunkSize;
    errorRetryDelay;
    constructor(params) {
        if (params.tonClient) {
            this.tonClient = params.tonClient;
            if (params.testnet != undefined) {
                throw new Error(`Can't specify "testnet" when "tonClient" is provided`);
            }
            if (params.toncenterApiKey != undefined) {
                throw new Error(`Can't specify "toncenterApiKey" when "tonClient" is provided`);
            }
        }
        else {
            this.tonClient = new TonClient({
                endpoint: params.testnet ? testEndpoint : mainEndpoint,
                apiKey: params.toncenterApiKey,
            });
        }
        this.checkIntervalInSeconds = params.checkIntervalInSeconds ?? 20;
        this.chunkSize = params.chunkSize ?? 25;
        this.errorRetryDelay = params.errorRetryDelay ?? 60;
    }
    async currentTrackingStateOf(address) {
        if (typeof address === 'string')
            address = Address.parse(address);
        const last = await Transaction.lastOrNull(this.tonClient, address);
        if (last == null)
            return defaultTrackingState;
        else
            return makeTrackingState(last.id.lt);
    }
    async newPaymentsTo(address, trackingState) {
        if (typeof address === 'string')
            address = Address.parse(address);
        const untilId = (await Transaction.last(this.tonClient, address)).id;
        const transactions = await Transaction.getAllSince(this.tonClient, address, this.chunkSize, trackingState.lastProcessedLt, untilId, true);
        const payments = [];
        for (const tr of transactions) {
            if (!tr.inMessage) // How can it even be possible?
                continue;
            if (!addressEqual(tr.inMessage.destination, address))
                continue;
            if (tr.inMessage.source == null)
                continue;
            // if (addressEqual(tr.inMessage.source, address))
            // 	continue;
            const body = tr.inMessage.body;
            if (!body) // Empty messages without comment
                continue;
            if (body.type !== 'text')
                continue;
            payments.push({
                source: tr.inMessage.source,
                amount: tr.inMessage.value.toNumber(),
                message: body.text,
            });
        }
        return {
            payments,
            nextTrackingState: {
                lastProcessedLt: untilId.lt,
            },
        };
    }
    async startPaymentTracking(address, trackingState, callback) {
        while (true) {
            try {
                const paymentsUpdate = await this.newPaymentsTo(address, trackingState);
                if (paymentsUpdate.payments.length > 0
                    || !trackingStateEqual(trackingState, paymentsUpdate.nextTrackingState)) {
                    await callback(paymentsUpdate);
                }
                trackingState = paymentsUpdate.nextTrackingState;
                await sleep(this.checkIntervalInSeconds);
            }
            catch (ex) {
                await sleep(this.errorRetryDelay);
            }
        }
    }
}
//# sourceMappingURL=PaymentTracker.js.map