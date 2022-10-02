import { Address, TonClient, TonTransaction } from "ton";


export type TransactionId = {
	lt: string,
	hash: string,
};


export async function lastOrNull(
	tonClient: TonClient,
	address: Address,
): Promise<TonTransaction | null> {
	const lastTransactions = await tonClient.getTransactions(address, { limit: 1 });
	if (lastTransactions.length >= 2)
		throw new Error(`Strange: expected to get 1 transaction as "last", received ${lastTransactions.length}`);
	return lastTransactions[0] ?? null;
}

export async function last(
	tonClient: TonClient,
	address: Address,
): Promise<TonTransaction> {
	const res = await lastOrNull(tonClient, address);
	if (res == null)
		throw new Error(`Can't get the last transaction because there are none at address: ${address.toFriendly()}`);

	return res;
}


export async function getAllSince(
	tonClient: TonClient,
	address: Address,
	chunkSize: number,
	sinceLt?: number | string, // exclusive
	untilId?: TransactionId,
	inclusive?: boolean,
): Promise<TonTransaction[]> {
	sinceLt = sinceLt?.toString();

	let untilLt: string | undefined = undefined;
	let hash: string | undefined = undefined;

	if (untilId) {
		untilLt = untilId.lt;
		hash = untilId.hash;
	}

	const res = [];
	do {
		const chunk: TonTransaction[] = await tonClient.getTransactions(address, {
			limit: chunkSize,
			to_lt: sinceLt,

			hash,
			lt: untilLt,
			inclusive,
		});
		//console.log('chunk length:', chunk.length);
		res.push(...chunk);

		const tr = chunk.at(-1); // last in block
		if (!tr) break;
		
		hash = tr.id.hash;
		untilLt = tr.id.lt;
		inclusive = false; // to avoid overlap

		if (chunk.length < chunkSize) break;
	} while (true); // 'chunk' "not defined" here - stupid compiler

	return res;
}


