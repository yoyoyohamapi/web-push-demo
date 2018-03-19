const Koa = require('koa')
const serve = require('koa-static')
const bodyParser = require('koa-bodyparser')

const app = new Koa()
const router = require('./router')
const port = process.env.PORT || 3000

app
  .use(serve('client'))
  .use(bodyParser())
  .use(router.routes())
  .use(router.allowedMethods())

app.listen(port)
console.log(`服务已启动，请访问 http://localhost:${port}`)
