self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {}
  event.waitUntil(
    self.registration.showNotification(data.title ?? 'X1 Pay', {
      body: data.body,
      icon: '/icon-192.png',
      badge: '/icon-96.png',
      data: { url: data.url ?? '/admin/pedidos' },
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(clients.openWindow(event.notification.data.url))
})
