export const sleep = (seconds) => new Promise((resolve, _) => setTimeout(resolve, seconds * 1000));
export const addressEqual = (a, b) => (!a && !b) || (a && b && a.equals(b));
//# sourceMappingURL=common.js.map