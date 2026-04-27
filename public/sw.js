self.addEventListener('push', function(event) {
  if (!event.data) return
  const data = event.data.json()
  event.waitUntil(
    self.registration.showNotification(data.titulo || 'TuAgentX', {
      body: data.cuerpo || '',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      data: { url: data.url || '/dashboard' }
    })
  )
})

self.addEventListener('notificationclick', function(event) {
  event.notification.close()
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  )
})
