self.addEventListener('push', event => {
  const data = event.data.json()
  console.log('This push event has data: ', data)

  const { title, body, icon, badge } = data
  const options = {
    body,
    icon,
    badge
  }
  const notificationPromise = self.registration.showNotification(title, options)
  event.waitUntil(notificationPromise)
})