
self.addEventListener('message', function (event) {
  console.log(event.data.action);
  console.log(event.data.userId);
  console.log(event.data.serviceUrl);
  
  writeDB(event.data.userId, event.data.serviceUrl);
});


self.addEventListener('push', function(event) {
  console.log('Received a push message', event);
  checkLogin();

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
  createDB();
  event.waitUntil(self.clients.claim());
  console.log('activate Complete');
});



function createDB(){
  var indexedDB = indexedDB;
  var db = null;

  if (indexedDB) {
    indexedDB.deleteDatabase("mydb");
    var openRequest = indexedDB.open("mydb", 1.0);
    openRequest.onsuccess = function(evt) {
      db = evt.result;

      //Chromeの場合、以下のように記載
      var store = db.createObjectStore("books", {"keyPath": "user"}, false);

      //インデックス作成
      store.createIndex("name", false);
    }
  }
}

function writeDB(user, url){
  //データ作成
  var userdata = {
    user: user,
    url: url
  };
  var indexedDB = webkitIndexedDB || window.mozIndexedDB || window.msIndexedDB;
  if (indexedDB) {
    var store = db.transaction([], IDBTransaction.READ_WRITE).objectStore("books");

    //データ追加
    store.add(userdata);
  }
}

function checkLogin() {
  var indexedDB = webkitIndexedDB || window.mozIndexedDB || window.msIndexedDB;
  var req = indexedDB.open("mydb");

  //成功時コールバック
  req.onsuccess = function(evt) {
    db = evt.result;
    var store = db.transaction().objectStore("books");
    var data = store.get("user");
    data.onsuccess = function(evt) {
      var value = evt.result;
      console.log(value);
    };
  };
}

