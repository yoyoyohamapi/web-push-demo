const $titleField = document.querySelector('#title')
const $bodyField = document.querySelector('#body')
const $sendBtn = document.querySelector('#send')

const services = {
  send(options) {
    return window.fetch('/api/webpush/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(options)
    }).then(resp => resp.json())
  },

  getPublicKey() {
    return window.fetch('/api/webpush/publicKey').then(resp => resp.text())
  },

  register(subscription) {
    return window.fetch('/api/webpush', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subscription)
    }).then(resp => resp.json())
  }
}

const sendClick$ = Rx.Observable.fromEvent($sendBtn, 'click')
const title$ = Rx.Observable.fromEvent($titleField, 'change').map(e => e.target.value)
const body$ = Rx.Observable.fromEvent($bodyField, 'change').map(e => e.target.value)
const options$ = Rx.Observable
  .combineLatest(title$, body$)
  .map(([title, body]) => ({title, body}))

const response$ = sendClick$
  .withLatestFrom(options$)
  .flatMap(([_, options]) => Rx.Observable.fromPromise(services.send(options)))

const windowLoad$ = Rx.Observable.fromEvent(window, 'load')

response$.subscribe(response => {
  console.log('response', response)
})

windowLoad$.subscribe(async () => {
  // 检测浏览器啊是否支持
  if (!supportPush()) {
    return
  }
  // 注册 service worker
  const register = await navigator.serviceWorker.register('./serviceWorker.js')
  // 是否允许推送服务
  try {
    await askPermission()
  } catch {
    return
  }
  // 获得当前的 push 订阅
  let subscription = await register.pushManager.getSubscription()
  // 如果没有订阅，则为当前用户进行订阅
  if (!subscription) {
    subscription = await subscribeUser(register)
  }
  console.log('subscription', subscription)
  // 注册该用户订阅到 push 服务，当服务发送消息后，service 获得相应
  const subscribeResponse = await services.register(subscription)
  console.log('subscribeResponse', subscribeResponse)
  $sendBtn.removeAttribute('disabled')
})

function supportPush() {
  return ('serviceWorker' in navigator) && ('PushManager' in window)
}

function urlB64ToUint8Array (base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

async function subscribeUser(register) {
  // 获得通信公钥
  const publicKey = await services.getPublicKey()
  // 为 service worker 订阅 push 服务
  const subscription = await register.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlB64ToUint8Array(publicKey)
  })
  return subscription
}

function askPermission() {
  return new Promise(function(resolve, reject) {
    const permissionResult = Notification.requestPermission(function(result) {
      resolve(result);
    });

    if (permissionResult) {
      permissionResult.then(resolve, reject);
    }
  })
  .then(function(permissionResult) {
    if (permissionResult !== 'granted') {
      throw new Error('We weren\'t granted permission.');
    }
  });
}