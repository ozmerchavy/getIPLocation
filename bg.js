const NEW_TAB = 'chrome://newtab/';

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  console.log(changeInfo);

  if (changeInfo.status == 'loading') {
    if (tab.url == NEW_TAB) return;
    
    console.log('running on tab', tab);

    chrome.scripting.executeScript({
      target: { tabId, allFrames: false },
      files: ['./main.js'],
    });
  }
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {         
    if (request.contentScriptQuery == "getdata") {
        var url = request.url;
        try{
            fetch(url)
            .then(response => response.text())
            .then(response => sendResponse(response))
            .catch(error => console.log('Error:', error))
        return true;
        }
        catch{
            return undefined
        }
     
    }
    if (request.contentScriptQuery == "postdata") {
        try{
            fetch(request.url, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json, application/xml, text/plain, text/html, *.*',
                    'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8'
                },
                body: 'result=' + request.data
            })
                .then(response => response.json())
                .then(response => sendResponse(response))
                .catch(error => console.log('Error:', error));
            return true;
        }
        catch{
            return undefined
        }
        }       
     
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {         
    if (request.contentScriptQuery == "getdata") {
        var url = request.url;
        try{
            fetch(url)
            .then(response => response.text())
            .then(response => sendResponse(response))
            .catch(error => console.log('Error:', error))
        return true;
        }
        catch{
            return undefined
        }
     
    }
    if (request.contentScriptQuery == "postdata") {
        try{
            fetch(request.url, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json, application/xml, text/plain, text/html, *.*',
                    'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8'
                },
                body: 'result=' + request.data
            })
                .then(response => response.json())
                .then(response => sendResponse(response))
                .catch(error => console.log('Error:', error));
            return true;
        }
        catch{
            return undefined
        }
        }       
     
});


// Function to clean up expired data
function cleanUpExpiredData() {
    chrome.storage.local.get(null, (result) => {
      const currentTime = Date.now();
      for (const key in result) {
        if (result.hasOwnProperty(key)) {
          const item = result[key];
          if (item.expiresAt && item.expiresAt <= currentTime) {
            chrome.storage.local.remove(key);
          }
        }
      }
    });
  }
  
//   // Set up an alarm to trigger the cleanup function once a day
//   chrome.alarms.create("dailyCleanup", {
//     periodInMinutes: 24 * 60, // 24 hours
//   });
  
//   // Event listener for the alarm
//   chrome.alarms.onAlarm.addListener((alarm) => {
//     if (alarm.name === "dailyCleanup") {
//       cleanUpExpiredData();
//     }
//   });
  
//   // Listen for incoming messages from content script or foreground page
//   chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
//     if (message.type === "saveData") {
//       saveDataToStorage(message.key, message.data, sendResponse);
//       return true; // Indicates that we want to send a response asynchronously
//     } else if (message.type === "getData") {
//       getDataFromStorage(message.key, sendResponse);
//       return true; // Indicates that we want to send a response asynchronously
//     }
//   });
  