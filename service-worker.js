self.addEventListener('push', function(event) {
  console.log('Received a push message', event);
  var registration = self.registration;
  registration.unregister().then(function(result) { });
/*
  var title = 'Yay a message.';
  var body = 'We have received a push message.';
  var icon = '/images/icon-192x192.png';
  var tag = 'simple-push-demo-notification-tag';

  event.waitUntil(
    self.registration.showNotification(title, {
      body: body,
      icon: icon,
      tag: tag
    })
  );
*/
});

self.addEventListener('notificationclick', function(event) {
  var registration = self.registration;
  registration.unregister().then(function(result) { });

});

self.addEventListener('activate', function(event) {
  event.waitUntil(self.clients.claim());
  console.log('activate Complete');
});
