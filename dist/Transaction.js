export async function lastOrNull(tonClient, address) {
    const lastTransactions = await tonClient.getTransactions(address, { limit: 1 });
    if (lastTransactions.length >= 2)
        throw new Error(`Strange: expected to get 1 transaction as "last", received ${lastTransactions.length}`);
    return lastTransactions[0] ?? null;
}
export async function last(tonClient, address) {
    const res = await lastOrNull(tonClient, address);
    if (res == null)
        throw new Error(`Can't get the last transaction because there are none at address: ${address.toFriendly()}`);
    return res;
}
export async function getAllSince(tonClient, address, chunkSize, sinceLt, // exclusive
untilId, inclusive) {
    sinceLt = sinceLt?.toString();
    let untilLt = undefined;
    let hash = undefined;
    if (untilId) {
        untilLt = untilId.lt;
        hash = untilId.hash;
    }
    const res = [];
    do {
        const chunk = await tonClient.getTransactions(address, {
            limit: chunkSize,
            to_lt: sinceLt,
            hash,
            lt: untilLt,
            inclusive,
        });
        //console.log('chunk length:', chunk.length);
        res.push(...chunk);
        const tr = chunk.at(-1); // last in block
        if (!tr)
            break;
        hash = tr.id.hash;
        untilLt = tr.id.lt;
        inclusive = false; // to avoid overlap
        if (chunk.length < chunkSize)
            break;
    } while (true); // 'chunk' "not defined" here - stupid compiler
    return res;
}
//# sourceMappingURL=Transaction.js.map