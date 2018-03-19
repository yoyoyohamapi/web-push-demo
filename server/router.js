const webpush = require('web-push')
const Router = require('koa-router')
const router = new Router()
const subscriptions = []

const vapidKeys = webpush.generateVAPIDKeys()
webpush.setVapidDetails(
  process.env.MAILTO,
  vapidKeys.publicKey,
  vapidKeys.privateKey
)

router.get('/api/webpush/publicKey', async (ctx, next) => {
  ctx.body = vapidKeys.publicKey
})

router.post('/api/webpush', async (ctx, next) => {
  subscriptions.push(ctx.request.body)
  ctx.body = {
    message: '订阅成功',
    applicationServerKey: vapidKeys.publicKey
  }
}) 

router.post('/api/webpush/send', async (ctx, next) => {
  const { body, title } = ctx.request.body
  const payload = {
    body,
    title,
    icon: 'icon',
    badge: 'badge'
  }
  const subscriptionsPromise = subscriptions.map(subscription => {
    return webpush.sendNotification(subscription, JSON.stringify(payload))
  })
  try {
    await Promise.all(subscriptionsPromise)
    ctx.body = {
      message: `Sent push notification to ${subscriptions.length} subscriber(s)`
    }
  } catch (err) {
    ctx.body = {
      error: 400,
      message: err.message
    }
  }
})

module.exports = router

