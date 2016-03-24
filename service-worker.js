var USERS_FILE_NAME = 'users.json';
var CACHE_KEY = 'v1';


self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_KEY).then(function(cache) {
      return cache.addAll([
        USERS_FILE_NAME
      ]);
    })
  );
});

self.addEventListener('push', function(event) {
  console.log('Received a push message', event);
  console.log(getJsonData());

  var title = 'yt-test.';
  var body = 'yt-test のページで登録したServiceWorkerです。';
  var icon = '/images/icon-192x192.png';
  var tag = 'simple-push-demo-notification-tag';

  event.waitUntil(
    self.registration.showNotification(title, {
      body: body,
      icon: icon,
      tag: tag
    })
  );
});

self.addEventListener('notificationclick', function(event) {
  console.log('On notification click: ', event.notification.tag);
  // Android doesn’t close the notification when you click on it
  // See: http://crbug.com/463146
  event.notification.close();

  // This looks to see if the current is already open and
  // focuses if it is
  event.waitUntil(clients.matchAll({
    type: 'window'
  }).then(function(clientList) {
    for (var i = 0; i < clientList.length; i++) {
      var client = clientList[i];
      if (client.url === '/' && 'focus' in client) {
        return client.focus();
      }
    }
    if (clients.openWindow) {
      return clients.openWindow('/');
    }
  }));
});

self.addEventListener('activate', function(event) {
  event.waitUntil(self.clients.claim());
  console.log('activate Complete');
});



function getJsonData() {
  e.respondWith(
    caches.open(CACHE_KEY).then(function (cache) {
      return cache.match(USERS_FILE_NAME).then(function (response) {
       console.log(response);
       return response;
      });
    })
  );
/*
  e.respondWith(
    caches.open(CACHE_KEY).then(function (cache) {
      return cache.match('https://web-push.github.io/yt-test/' + USERS_FILE_NAME).then(function (response) {
       console.log(response);
       return response;
      });
    })
  );
*/
}