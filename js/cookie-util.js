var COOKIE_NAME = "web-push";
var COOKIE_EXPIRATION_DATE = 1;

/** クッキーの書き込み */
function writeCookie(aValue, aName, aExpires) {
    var value = aValue;
    var name = aName;
    var expires = aExpires;

    // クッキーの有効確認
    if (isEnabledCookie()) {
        if (!value) {
            return false;
        }
        if (!name) {
            name = COOKIE_NAME;
        }
        if (!expires) {
            // 有効期限の作成
            var nowtime = new Date().getTime();
            var clear_time = new Date(nowtime + (60 * 60 * 24 * 1000 * COOKIE_EXPIRATION_DATE));
            expires = clear_time.toGMTString();
        }

        // クッキーの発行（書き込み）
        document.cookie = name + "=" + escape(value) + "; expires=" + expires + '; path=/';
        return true;
    } else {
        return false;
    }
}

/** クッキーの読み込み */
function readCookie(aName) {
    var name = aName;
    var cookie;
    // クッキーの有効確認
    if (isEnabledCookie()) {
        if (!name) {
            name = COOKIE_NAME;
        }

        // 発行したクッキーの取得（読み込み）
        if (document.cookie) {
            // 取得したクッキーを分割
            var cookies = document.cookie.split("; ");
            for (var i = 0; i < cookies.length; i++) {
                var str = cookies[i].split("=");
                if (str[0] == name) {
                    cookie = unescape(str[1]);
                    break;
                }
            }
        }
    }
    return cookie;
}

/** クッキーの削除 */
function deleteCookie(aName) {
    var name = aName;

    // クッキーの有効確認
    if (isEnabledCookie()) {
        if (!name) {
            name = COOKIE_NAME;
        }

        //日付データを作成する
        var date1 = new Date();

        //1970年1月1日00:00:00の日付データをセットする
        date1.setTime(0);

        //有効期限を過去にして書き込む
        document.cookie = name + "=;expires=" + date1.toGMTString() + '; path=/';

        return true;
    } else {
        return false;
    }
}

/** クッキーの有無確認 */
function isEnabledCookie() {
    return window.navigator.cookieEnabled;
}