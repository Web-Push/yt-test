
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
  var database = indexedDB;
  var db = null;

  if (database) {
    database.deleteDatabase("mydb");

    var openRequest = database.open("mydb", 1.0);
    
    openRequest.onupgradeneeded = function(event) {
      // データベースのバージョンに変更があった場合(初めての場合もここを通ります。)
      db = event.target.result;
      var store = db.createObjectStore("books", { keyPath: "mykey"}, false);
     
      // インデックスを作成します。
      store.createIndex("name", false);
    }
    
    openRequest.onsuccess = function(event) {
      db = event.target.result;
    }
  }
}

function writeDB(user, url){
  //データ作成
  var userdata = {
    user: user,
    url: url
  };
  
  var database = indexedDB;
  var req = database.open("mydb");
  var db = null;
  
  //成功時コールバック
  req.onsuccess = function(evt) {
    db = evt.target.result;
    var transaction = db.transaction(["books"], "readwrite");
    var store = transaction.objectStore("books");

    //データ追加
    store.add(userdata);
  }
}

function checkLogin() {
  var database = indexedDB;
  var req = database.open("mydb");
  var db = null;
  
  //成功時コールバック
  req.onsuccess = function(evt) {
    db = evt.target.result;
    var transaction = db.transaction(["books"], "readwrite");
    var store = transaction.objectStore("books");
    var request = store.get("user");
    request.onsuccess = function(evt) {
      if (event.target.result === undefined) {
        console.log('キーが存在しない');
      } else {
        // 取得成功
        console.log(event.target.result.user);
        console.log(event.target.result.url);
      }
    };
  };
}

