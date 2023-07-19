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
        fetch(url)
            .then(response => response.text())
            .then(response => sendResponse(response))
            .catch()
        return true;
    }
    if (request.contentScriptQuery == "postdata") {
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
});

