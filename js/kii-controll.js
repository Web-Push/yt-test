var username = "yt-test";
var password = "1234567890";
var DATA_BUCKET = "test_bucket";
var KII_KEY_USR_ID = "userId";
var KII_KEY_SERVICE_URL = "serviceUrl";
var KII_KEY_ENDPOINT = "endpoint";

window.addEventListener('load', function() {
  Kii.initializeWithSite("5a2ac7b1", "1bc385a570612507bb8740ba861b14cb", KiiSite.JP);
  createUser();
}, false);

function createUser() {
  // Create the KiiUser object
  var user = KiiUser.userWithUsername(username, password);
  
  // Register the user, defining callbacks for when the process completes
  user.register({
  // Called on successful registration
    success: function(theUser) {
      // Print some info to the log
      console.log("User registered!");
      console.log(theUser);
    },
    // Called on a failed registration
    failure: function(theUser, errorString) {
      // Print some info to the log
      console.log("Error registering: " + errorString);
    }
  });
}

function registerData(userId, endpoint, serviceUrl) {
  KiiUser.authenticate(username, password, {
    // Called on successful authentication
    success: function(theUser) {
      // Print some info to the log
      console.log("User authenticated!");
      console.log(theUser);
      var appBucket = Kii.bucketWithName(DATA_BUCKET);
      
      existData(userId, serviceUrl).then(function(result) {
        // 上書き保存
        console.log("Update Object");
        result.refresh({
          success: function(theObject) {
            console.log("Object refreshed!");
            console.log(theObject);
            theObject.set(KII_KEY_ENDPOINT, endpoint);
            theObject.saveAllFields({
              success: function(theObject) {
              console.log("Update EndPoint!");
              console.log(theObject);
            },
            failure: function(theObject, errorString) {
              console.log("Error update object: " + errorString);
            }
          });

          },
          failure: function(theObject, errorString) {
            console.log("Error refreshing object: " + errorString);
          }
        });
      }, function(result) {
        // 新規保存
        console.log("Create new Object");
        var obj = appBucket.createObject();
        obj.set(KII_KEY_USR_ID, userId);
        obj.set(KII_KEY_ENDPOINT, endpoint);
        obj.set(KII_KEY_SERVICE_URL, serviceUrl);
        obj.save({
          success: function(theObject) {
            console.log("Object saved & bucket created!");
          },
          failure: function(theObject, errorString) {
            console.log("Error saving object and bucket: " + errorString);
          }
        });
      });
  
    },
    // Called on a failed authentication
    failure: function(theUser, errorString) {
      // Print some info to the log
      console.log("Error authenticating: " + errorString);
    }
  })
}

function existData(id, url) {
  return new Promise(function (resolve, reject) {
    var bucket = Kii.bucketWithName(DATA_BUCKET);
    var clause1 = KiiClause.equals(KII_KEY_USR_ID, id);
    var clause2 = KiiClause.equals(KII_KEY_SERVICE_URL, url);
    var totalClause = KiiClause.and(clause1, clause2);
    var query = KiiQuery.queryWithClause(totalClause);
    
    // Define the callbacks
    var queryCallbacks = {
      success: function(queryPerformed, resultSet, nextQuery) {
        if (resultSet.length >= 1) {
          resolve(resultSet[0]);
        } else {
          reject();
        }
      },
      failure: function(queryPerformed, anErrorString) {
        reject();
      }
    }
    
    // Execute the query
    bucket.executeQuery(query, queryCallbacks);
  })
}

function getList() {
  return new Promise(function (resolve, reject) {
    var bucket = Kii.bucketWithName(DATA_BUCKET);
    // Build "all" query
    var all_query = KiiQuery.queryWithClause();
   
    // Define the callbacks
    var queryCallbacks = {
      success: function(queryPerformed, resultSet, nextQuery) {
        // ulタグを生成してinsertに追加
        var list = [];
        for(var i=0; i < resultSet.length; i++) {
          var obj = new Object();
          obj[KII_KEY_USR_ID] = resultSet[i].get(KII_KEY_USR_ID);
          obj[KII_KEY_SERVICE_URL] = resultSet[i].get(KII_KEY_SERVICE_URL);
          obj[KII_KEY_ENDPOINT] = resultSet[i].get(KII_KEY_ENDPOINT);
          list.push(obj);
        }
        resolve(list);
      },
      failure: function(queryPerformed, anErrorString) {
        reject();
      }
    }
    
    // Execute the query
    bucket.executeQuery(all_query, queryCallbacks);
  })
}

function getListTest() {
  getList().then(function(result) {
    var insert = $('<ul>').addClass('list');
 
    for(var i = 0; i < result.length; i++) {
        // liタグを生成してテキスト追加
        var newLi = $('<li>').text(result[i][KII_KEY_USR_ID] + " " + result[i][KII_KEY_SERVICE_URL] + " " + result[i][KII_KEY_ENDPOINT]);
        // insertに生成したliタグを追加
        insert.append(newLi);
    }
 
    // insertを#sample内に追加
    $('#sample').append(insert);
  })
}
