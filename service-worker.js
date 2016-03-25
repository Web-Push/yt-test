/** Webサイト側からPostMessageで送られたデータを受信する */
self.addEventListener('message', function (event) {
  console.log(event.data.action);
  console.log(event.data.userId);
  console.log(event.data.serviceUrl);
  
  writeDB(event.data.userId, event.data.serviceUrl);
});

/** Push通知を受けたときの処理 */
self.addEventListener('push', function(event) {
  console.log('Received a push message', event);

  fetch('https://web-push.github.io/yt-test/users.json').then(function(response){
    if (response.status !== 200) {
      console.log('Looks like there was a problem. Status Code: ' + response.status);
    } else {
      response.text().then(function(textdata) {
        console.log('text:' + textdata);
        var contact = JSON.parse(jsontext);
        console.log('JSON:' + contact);
      })
    }
  });
/*
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
*/
});

/** Notificationをクリックしたときの処理 */
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

/** ServiceWorkerのactivateが完了したときの処理 */
self.addEventListener('activate', function(event) {
  createDB();
  event.waitUntil(self.clients.claim());
  console.log('activate Complete');
});


/** indexDBの生成処理 */
function createDB(){
  // chrome以外のブラウザで試すときは[var database = indexedDB]の定義を変えないと多分動かない
  var database = indexedDB;
  var db = null;

  if (database) {
    database.deleteDatabase("mydb");
    var openRequest = database.open("mydb", 1.0);
    openRequest.onupgradeneeded = function(event) {
      // データベースのバージョンに変更があった場合(初めての場合もここを通ります。)
      db = event.target.result;
      var store = db.createObjectStore("books", { keyPath: "mykey"});
      // インデックスを作成します。
      store.createIndex("myvalueIndex", "myvalue");
    }

    openRequest.onsuccess = function(event) {
      db = event.target.result;
    }
  }
}

/** indexDBへ書き込み処理（書き方か読み方を変えないと面倒） */
function writeDB(user, url){
  var database = indexedDB;
  var req = database.open("mydb");
  var db = null;

  //成功時コールバック
  req.onsuccess = function(evt) {
    db = evt.target.result;
    var transaction = db.transaction(["books"], "readwrite");
    var store = transaction.objectStore("books");

    //データ追加
    store.put({ mykey: "user", myvalue: user});
    store.put({ mykey: "url", myvalue: url});
  }
}

/** indexDBに登録されているデータとfetchしてきたデータとのマッチング */
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
      if (evt.target.result === undefined) {
        console.log('キーが存在しない');
      } else {
        // 取得成功
        console.log(evt.target.result.myvalue);
      }
    };

    var request2 = store.get("url");
    request2.onsuccess = function(evt) {
      if (evt.target.result === undefined) {
        console.log('キーが存在しない');
      } else {
        // 取得成功
        console.log(evt.target.result.myvalue);
      }
    };
  };
}

