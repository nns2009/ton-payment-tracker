import { Address, TonClient } from "ton";

import { addressEqual, sleep } from "./common.js";
import * as Transaction from './Transaction.js';
import { TransactionId } from "./Transaction.js";



export type TrackingState = {
	lastProcessedLt?: string,
};

export type Payment = {
	source: Address,
	amount: number,
	message: string,
};

export type PaymentsUpdate = {
	payments: Payment[],
	nextTrackingState: TrackingState,
}

export type PaymentReceivedCallback =
	(paymentsUpdate: PaymentsUpdate) => void;


export const defaultTrackingState: TrackingState = {
	lastProcessedLt: undefined,
};

export function trackingStateEqual(a: TrackingState, b: TrackingState): boolean {
	return a.lastProcessedLt === b.lastProcessedLt;
}

export function makeTrackingState(lastProcessedLt: string): TrackingState {
	return { lastProcessedLt };
}


export const testEndpoint = "https://testnet.toncenter.com/api/v2/jsonRPC";
export const mainEndpoint = "https://toncenter.com/api/v2/jsonRPC";
//export const workchain = 0;

export class PaymentTracker {
	tonClient: TonClient;
	checkIntervalInSeconds: number;
	chunkSize: number;
	errorRetryDelay: number;

	constructor(params: {
		tonClient?: TonClient,
		testnet?: boolean,
		toncenterApiKey?: string,
		checkIntervalInSeconds?: number,
		chunkSize?: number,
		errorRetryDelay?: number,
	}) {
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

	async currentTrackingStateOf(address: Address | string): Promise<TrackingState> {
		if (typeof address === 'string')
			address = Address.parse(address);
		
		const last = await Transaction.lastOrNull(this.tonClient, address);
		if (last == null)
			return defaultTrackingState;
		else
			return makeTrackingState(last.id.lt);
	}

	async newPaymentsTo(
		address: Address | string,
		trackingState: TrackingState,
	): Promise<PaymentsUpdate> {
		if (typeof address === 'string')
			address = Address.parse(address);

		const untilId: TransactionId = (await Transaction.last(this.tonClient, address)).id;

		const transactions = await Transaction.getAllSince(
			this.tonClient, address, this.chunkSize, trackingState.lastProcessedLt, untilId, true);

		const payments: Payment[] = [];

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
	
	async startPaymentTracking(
		address: Address | string,
		trackingState: TrackingState,
		callback: PaymentReceivedCallback,
	): Promise<void> {
		while (true) {
			try {
				const paymentsUpdate = await this.newPaymentsTo(address, trackingState);

				if (paymentsUpdate.payments.length > 0
					|| !trackingStateEqual(
						trackingState,
						paymentsUpdate.nextTrackingState
					)
				) {
					await callback(paymentsUpdate);
				}
	
				trackingState = paymentsUpdate.nextTrackingState;
				await sleep(this.checkIntervalInSeconds);
			} catch (ex) {
				await sleep(this.errorRetryDelay);
			}
		}
	}
}

