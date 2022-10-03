# Ton Payment Tracker

Accept payments in TON with a few lines, without delving into blockchain details!

Start observing specific address and get "notifications" (callback) when this address receives any payments. It's then up to you how you process them.

## Installation
```
npm i https://github.com/nns2009/ton-payment-tracker
```

## Example usage
### Create PaymentTracker object
```ts
const tracker = new PaymentTracker({ toncenterApiKey });
```

### Save reference from which you start tracking
```ts
let trackingState = await tracker.currentTrackingStateOf(address);
```

### Start tracking
```ts
tracker.startPaymentTracking(
	address, trackingState,
	paymentsUpdate => {
		console.log('New payments:', paymentsUpdate);
	}
)
```

## Examples repository
https://github.com/nns2009/ton-payment-tracker-example

## Presentation
https://www.canva.com/design/DAFN6DbaJ2s/RWP3cA0nW96NIjr3KVsibg/view


# Author
## Igor Konyakhin
Telegram: [@nns2009](https://t.me/nns2009) <br>
YouTube: [Awesome GameDev](https://www.youtube.com/channel/UCZacxOhkmPS2cklzU1_Ya9Q) <br>
https://codeforces.com/profile/nns2009 <br>
https://vk.com/nns2009 <br>
https://facebook.com/nns2009
