import { Address } from "ton";


export const sleep = (seconds: number) =>
	new Promise((resolve, _) => setTimeout(resolve, seconds * 1000));

export const addressEqual = (a: Address | null, b: Address | null) =>
	(!a && !b) || (a && b && a.equals(b));
