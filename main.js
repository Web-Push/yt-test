var API_KEY = window.GoogleSamples.Config.gcmAPIKey;
var GCM_ENDPOINT = 'https://android.googleapis.com/gcm/send';

var isPushEnabled = false;

/** ログインボタン処理 */
function onLogin() {
    var error;
    var idText = document.in.id_auIdTxt.value;

    // プログレスバー表示
    document.getElementById("id_loader").style.display="";
    // ログイン（クッキー書き込み）
    if (idText) {
        if (!writeCookie(idText)) {
            error = "ログインに失敗しました。";
        }
    } else {
        error = "IDを入力してください。";
    }

    // ログイン失敗なら解除
    if (error) {
        unsubscribe();
    } else {
        // ログイン成功ならサブスクリプション取得
        // ServiceWorkerの登録
        // Check that service workers are supported, if so, progressively
        // enhance and add push messaging support, otherwise continue without it.
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('./service-worker.js').then(initialiseState());
            // TODO 本来は初期化成功時に行いたい
            subscribe();
        } else {
            console.log('Service workers aren\'t supported in this browser.');
            error = "ServiceWorkerの登録に失敗しました。";
        }
    }

    // 遅延処理
    var timerId = setInterval(function() {
        //タイマー終了
        clearInterval(timerId);
        // プログレスバー非表示
        document.getElementById("id_loader").style.display="none";
        // エラー表示
        if (error) {
            alert(error);
        } else {
            showLogin(false);
        }
    }, 1000);
}

/** ログアウトボタン処理 */
function onLogout() {
    var error;
    // プログレスバー表示
    document.getElementById("id_loader").style.display="";

    if (!deleteCookie()) {
        error = "ログアウトに失敗しました。";
    }

    // ServiceWorkerの解除
    unsubscribe();

    // 遅延処理
    var timerId = setInterval(function() {
        //タイマー終了
        clearInterval(timerId);
        // プログレスバー非表示
        document.getElementById("id_loader").style.display="none";
        // エラー表示
        if (error) {
            alert(error);
        } else {
            showLogin(true);
        }
    }, 1000);
}

/** クッキー書き込みボタン処理 */
function onWrite() {
    var idText = document.in.id_auIdTxt.value;
    if (idText) {
        if (writeCookie(idText)) {
            alert("書き込みに成功しました。");
        } else {
            alert("書き込みに失敗しました。");
        }
    } else {
        alert("IDを入力してください。");
    }
}

/** クッキー読み込みボタン処理 */
function onRead() {
    var id;
    id = readCookie();

    alert("id : " + id);
}

/** クッキー削除ボタン処理 */
function onDelete() {
    if (deleteCookie()) {
        alert("削除に成功しました。");
    } else {
        alert("削除に失敗しました。");
    }
}

/** ページ読み込み処理 */
window.addEventListener('load', function() {
    var result;
    result = readCookie();

    // ログインボタン表示切替
    showLogin(!result);
});

/** ログインボタン表示切替 */
function showLogin(aShow) {
    if (aShow) {
        document.getElementById("id_auIdTxt").style.display="";
        document.getElementById("id_loginBtn").style.display="";
        document.getElementById("id_logoutBtn").style.display="none";
    } else {
        document.getElementById("id_auIdTxt").style.display="none";
        document.getElementById("id_loginBtn").style.display="none";
        document.getElementById("id_logoutBtn").style.display="";
    }
}

/** Subscriptionとendpointのマージ */
// This method handles the removal of subscriptionId
// in Chrome 44 by concatenating the subscription Id
// to the subscription endpoint
function endpointWorkaround(pushSubscription) {
  // Make sure we only mess with GCM
  if (pushSubscription.endpoint.indexOf('https://android.googleapis.com/gcm/send') !== 0) {
    return pushSubscription.endpoint;
  }

  var mergedEndpoint = pushSubscription.endpoint;
  // Chrome 42 + 43 will not have the subscriptionId attached
  // to the endpoint.
  if (pushSubscription.subscriptionId &&
    pushSubscription.endpoint.indexOf(pushSubscription.subscriptionId) === -1) {
    // Handle version 42 where you have separate subId and Endpoint
    mergedEndpoint = pushSubscription.endpoint + '/' + pushSubscription.subscriptionId;
  }
  return mergedEndpoint;
}

/** テスト用エンドポイント作成送信 */
function sendSubscriptionToServer(subscription) {
  // TODO: Send the subscription.endpoint
  // to your server and save it to send a
  // push message at a later date
  //
  // For compatibly of Chrome 43, get the endpoint via
  // endpointWorkaround(subscription)
  console.log('TODO: Implement sendSubscriptionToServer()');

  var mergedEndpoint = endpointWorkaround(subscription);

  console.log(mergedEndpoint);
  // This is just for demo purposes / an easy to test by
  // generating the appropriate cURL command
  showCurlCommand(mergedEndpoint);
}

/** GCM向けCurlコマンド作成 */
// NOTE: This code is only suitable for GCM endpoints,
// When another browser has a working version, alter
// this to send a PUSH request directly to the endpoint
function showCurlCommand(mergedEndpoint) {
  // The curl command to trigger a push message straight from GCM
  if (mergedEndpoint.indexOf(GCM_ENDPOINT) !== 0) {
    console.log('This browser isn\'t currently ' +
      'supported for this demo');
    return;
  }

  var endpointSections = mergedEndpoint.split('/');
  var subscriptionId = endpointSections[endpointSections.length - 1];

  var curlCommand = 'curl --header "Authorization: key=' + API_KEY +
    '" --header Content-Type:"application/json" ' + GCM_ENDPOINT +
    ' -d "{\\"registration_ids\\":[\\"' + subscriptionId + '\\"]}"';
}

function unsubscribe() {
  navigator.serviceWorker.ready.then(function(serviceWorkerRegistration) {
    // To unsubscribe from push messaging, you need get the
    // subcription object, which you can call unsubscribe() on.
    serviceWorkerRegistration.pushManager.getSubscription().then(
      function(pushSubscription) {
        // Check we have a subscription to unsubscribe
        if (!pushSubscription) {
          // No subscription object, so set the state
          // to allow the user to subscribe to push
          isPushEnabled = false;
          return false;
        }

        // TODO: Make a request to your server to remove
        // the users data from your data store so you
        // don't attempt to send them push messages anymore

        // We have a subcription, so call unsubscribe on it
        pushSubscription.unsubscribe().then(function() {
          isPushEnabled = false;
          return true;
        }).catch(function(e) {
          // We failed to unsubscribe, this can lead to
          // an unusual state, so may be best to remove
          // the subscription id from your data store and
          // inform the user that you disabled push

          console.log('Unsubscription error: ', e);
          return false;
        });
      }).catch(function(e) {
        console.log('Error thrown while unsubscribing from ' +
          'push messaging.', e);
        return false;
      });
  });
}

function subscribe() {
  // Disable the button so it can't be changed while
  // we process the permission request
  navigator.serviceWorker.ready.then(function(serviceWorkerRegistration) {
    serviceWorkerRegistration.pushManager.subscribe({userVisibleOnly: true})
      .then(function(subscription) {

       if (!subscription) {
         console.log('not subscription');
       } else {
         console.log('subscribe');
       }
        // The subscription was successful
        isPushEnabled = true;

        // TODO: Send the subscription subscription.endpoint
        // to your server and save it to send a push message
        // at a later date
        return sendSubscriptionToServer(subscription);
      })
      .catch(function(e) {
        if (Notification.permission === 'denied') {
          // The user denied the notification permission which
          // means we failed to subscribe and the user will need
          // to manually change the notification permission to
          // subscribe to push messages
          console.log('Permission for Notifications was denied');
          return true;
        } else {
          // A problem occurred with the subscription, this can
          // often be down to an issue or lack of the gcm_sender_id
          // and / or gcm_user_visible_only
          console.log('Unable to subscribe to push.', e);
          return false;
        }
      });
  });
}

/** ServiceWorkerの初期設定 */
// Once the service worker is registered set the initial state
function initialiseState() {
  console.log('initialiseState() start');

  // ServiceWorkerがプッシュ通知に対応しているか
  // Are Notifications supported in the service worker?
  if (!('showNotification' in ServiceWorkerRegistration.prototype)) {
    console.log('Notifications aren\'t supported.');
    return false;
  }

  // 現在の通知権限を確認し通知が拒否されているか
  // Check the current Notification permission.
  // If its denied, it's a permanent block until the
  // user changes the permission
  if (Notification.permission === 'denied') {
    console.log('The user has blocked notifications.');
    return false;
  }

  // プッシュ通知がサポートされているか
  // Check if push messaging is supported
  if (!('PushManager' in window)) {
    console.log('Push messaging isn\'t supported.');
    return false;
  }

  // Service Worker の登録情報を取得
  // We need the service worker registration to check for a subscription
  navigator.serviceWorker.ready.then(function(serviceWorkerRegistration) {
    // 登録されているプッシュ通知(subscription)をPromiseで取得
    // Do we already have a push message subscription?
    serviceWorkerRegistration.pushManager.getSubscription()
      .then(function(subscription) {
        // Enable any UI which subscribes / unsubscribes from
        // push messages.
        if (!subscription) {
          // subscriptionオブジェクトの取得失敗
          console.log('not subscription');
          return false;
        }

        // Keep your server in sync with the latest subscription
        console.log('is subscription true');
        sendSubscriptionToServer(subscription);
        return true;
      })
      .catch(function(err) {
        console.log('Error during getSubscription()', err);
        return false;
      });
  });
  console.log('initialiseState() finish');
}