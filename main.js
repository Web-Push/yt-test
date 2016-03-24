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
        registServiceWorker();
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

    // Cookieからログインユーザーを取得する
    result = readCookie();
    console.log('LogoutUser=' + result);

    // KiiCloudからユーザーを削除する
    deleteData(result);

    // CooKieを削除する
    deleteCookie();

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

    // ページの読み込み時点でログイン状態ならServiceWorkerの登録とsubscribeを行う
    if (result) {
        getRegistration();
    }
});

/** ログインボタン表示切替 */
function showLogin(aShow) {
    if (aShow) {
        document.getElementById("id_auIdTxt").style.display="";
        document.getElementById("id_loginBtn").style.display="";
        document.getElementById("id_logoutBtn").style.display="none";
        document.getElementById("id_user").style.display="none";
    } else {
        document.getElementById("id_auIdTxt").style.display="none";
        document.getElementById("id_loginBtn").style.display="none";
        document.getElementById("id_logoutBtn").style.display="";
        document.getElementById("id_user").style.display="";

        var result = readCookie() + ' でログイン中';
        document.getElementById("id_user").innerHTML=result;
    }
}

/** ServiceWorkerの状態チェック */
function getRegistration() {
   navigator.serviceWorker.register('./service-worker.js').then(function(registration) {
    registration.pushManager.getSubscription().then(isReady);
  });
}

function isReady(result) {
    console.log(result);
    if (!result) {
        subscribe();
    } else {
        console.log('Subscriptionが取れたらDBを更新しておく（別ページによるログアウト→ログイン対策）');
        sendSubscriptionToServer(result);
    }
}

/** ServiceWorkerの登録処理 */
function registServiceWorker(result) {
    console.log(result);

    // ServiceWorkerがReady状態でなければ再登録をする
    if (!result) {
        // ログイン成功ならサブスクリプション取得
        // ServiceWorkerの登録
        // Check that service workers are supported, if so, progressively
        // enhance and add push messaging support, otherwise continue without it.
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('./service-worker.js').then(function(registration) {
                subscribe();
            });
        } else {
            console.log('Service workers aren\'t supported in this browser.');
            error = "ServiceWorkerの登録に失敗しました。";
        }
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

  // KiiCloudに登録
  userId = readCookie();
  endpoint = endpointWorkaround(subscription);
  serviceUrl = window.location.href;

  console.log('userId :' + userId);
  console.log('endpoint :' + endpoint);
  console.log('serviceUrl :' + serviceUrl);

  registerData(userId, endpoint, serviceUrl);


  navigator.serviceWorker.controller.postMessage({
    action: 'LoginUser',
    userId: userId,
    serviceUrl: serviceUrl
  });
}


// ServiceWorker の解除要求の結果（ログを出すだけ）
function onResult(result){
  console.log(result);
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

          // ServiceWorker の解除
          serviceWorkerRegistration.unregister().then(onResult);

          return true;
        }).catch(function(e) {
          // We failed to unsubscribe, this can lead to
          // an unusual state, so may be best to remove
          // the subscription id from your data store and
          // inform the user that you disabled push

          console.log('Unsubscription error: ', e);

          // ServiceWorker の解除
          serviceWorkerRegistration.unregister().then(onResult);

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
        console.log('subscribe');
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
