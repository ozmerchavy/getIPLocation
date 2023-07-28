function formatJSON(jsonObj) {
  const formatted = [];

  for (const key in jsonObj) {
    if (jsonObj.hasOwnProperty(key)) {
      formatted.push(`${key}: ${JSON.stringify(jsonObj[key])}`);
    }
  }

  return formatted.join('\n');
}



async function bgGET(url) {

    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          contentScriptQuery: "getdata",
          url: url
        },
        function (response) {
          if (response != undefined && response != "") {
            resolve(response);
          } else {
            resolve(null);
          }
        }
      );
    });
  }
  


  async function bgPOST(url, JSONdata) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          contentScriptQuery: "postdata",
          data: JSONdata,
          url: url
        },
        function (response) {
          if (response != undefined && response != "") {
            resolve(response);
          } else {
            resolve(null);
          }
        }
      );
    });
  }



// Save data to chrome.storage.local
async function saveDataToStorage(key, data) {
  return new Promise((resolve, reject) => {
    const expirationDate = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days from now
    // one day ill make the bg this cache
    // ((I hope))

    const itemToSave = {
      data: data,
      expiresAt: expirationDate,
    };

    const item = {};
    item[key] = itemToSave;

    chrome.storage.local.set(item, () => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve("Data successfully saved!");
      }
    });
  });
}


// Retrieve data from chrome.storage.local using key
async function getDataFromStorage(key) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(key, (result) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        const data = result[key]?.data;
        resolve(data);
      }
    });
  });
}




  async function getInfo(ip){
    const y = await getDataFromStorage(ip) || await bgGET(`https://freeipapi.com/api/json/${ip}`)
    let json
    try { json = JSON.parse(y)
      await saveDataToStorage(ip, y)
      }
    catch{

        return undefined
    }
    return json
}




//////////////////////////
/** HTML CSS Functions */
//////////////////////////


function wrapEachMatchInSpan(regex, classname, { rootNode = document.body } = {}) {
  const tagsToIgnore = new Set(["script", "style", "template", "noscript", "iframe", "area", "base", "br", "col", "command", "embed", "hr", "img", "input", "keygen", "link", "meta", "param", "source", "track", "wbr", "textarea"]);

  function isInputOfSomeSort(node) {
    return (
      node.isContentEditable ||
      node.designMode === 'on' ||
      (['INPUT', 'TEXTAREA'].includes(node.tagName) ||
        (['DIV', 'SPAN', 'TD'].includes(node.tagName) && node.hasAttribute('contenteditable')))
    );
  }



  function iterateTextNodes(node, action) {
    if (isInputOfSomeSort(node)){
      return
    }


    if (node.nodeType === Node.TEXT_NODE) {
      node.textContent.trim() && action(node);
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      if (tagsToIgnore.has(node.tagName.toLowerCase())) {
        return;
      }
      const style = window.getComputedStyle(node);
      if (style.display === "none" || style.visibility === "hidden") {
        return;
      }
      // process child nodes in reverse order to avoid infinite recursion
      for (let i = node.childNodes.length - 1; i >= 0; i--) {
        iterateTextNodes(node.childNodes[i], action);
      }
    }
  }

  function wrapInSpan(textNode, regex, classname) {
    const parent = textNode.parentNode;

    // if textNode is already wrapped, skip
    if (parent.classList.contains(classname)) return;
    
    const temp = document.createDocumentFragment();

    let lastIndex = 0, match;
    while ((match = regex.exec(textNode.textContent))) {
      const matchStart = match.index;
      const matchEnd = matchStart + match[0].length;

      if (matchStart > lastIndex) {
        temp.appendChild(
          document.createTextNode(
            textNode.textContent.substring(lastIndex, matchStart)
          )
        );
      }

      const span = document.createElement("span");
      span.className = classname;
      span.textContent = match[0];
      span.style.display = 'contents';
      temp.appendChild(span);

      lastIndex = matchEnd;
    }

    if (lastIndex < textNode.textContent.length) {
      temp.appendChild( document.createTextNode(textNode.textContent.substring(lastIndex)) );
    }

    parent.replaceChild(temp, textNode);
  }

  iterateTextNodes(rootNode, (textNode) => {
    wrapInSpan(textNode, regex, classname)
  });
}



function getAllIPSandWrapEm(){
  const IP_regex = /\b((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g;
  const IP_classname = 'EXTENSIONIPSpanNoStyleYet';
  wrapEachMatchInSpan(IP_regex, IP_classname);
  const spansWrappingIPs = [...document.querySelectorAll(`span.${IP_classname}`)];
  return spansWrappingIPs
}






function addTooltip(element, tooltipText) {
  const style = `
    .EXTENSIONtooltip {
      position: relative;
      display: inline-block;
      border-bottom: 1px dotted black;
    }

    .EXTENSIONtooltip .EXTENSIONtooltiptext {
      visibility: hidden;
      min-width: 40ch; 
      max-width: 300px;
      background-color: black;
      color: #fff;
      text-align: left;
      font-size: 12px;
      padding: 5px 10px;
      border-radius: 6px;
      position: absolute;
      z-index: 99999999;
      white-space: pre-wrap;
      word-break: break-all;
    }

    .EXTENSIONtooltip:hover .EXTENSIONtooltiptext {
      visibility: visible;
    }
  `;

  const styleElement = document.createElement('style');
  styleElement.textContent = style;

  const tooltipContainer = document.createElement('div');
  tooltipContainer.classList.add('EXTENSIONtooltip');
  element.appendChild(tooltipContainer);

  const tooltipTextElement = document.createElement('span');
  tooltipTextElement.classList.add('EXTENSIONtooltiptext');
  tooltipTextElement.textContent = tooltipText;
  tooltipContainer.appendChild(tooltipTextElement);

  document.head.appendChild(styleElement);

  element.addEventListener('mouseenter', () => {
    tooltipTextElement.style.visibility = 'visible';
  });

  element.addEventListener('mouseleave', () => {
    tooltipTextElement.style.visibility = 'hidden';
  });
}



function addLink(IPElement, link, tooltipText) {
  const linkElement = document.createElement('a');
  linkElement.href = link;
  linkElement.id = "EXTENSIONlink";
  linkElement.innerText = 'locate IP 🌍>>';
  linkElement.style.fontSize = 'x-small';
  linkElement.style.marginLeft = '5px';
  linkElement.target = '_blank'; 

  const container = document.createElement('span');
  container.style.display = 'inline-block';
  container.style.verticalAlign = 'top';

  container.appendChild(IPElement.cloneNode(true));
  container.appendChild(linkElement);
  addTooltip(container, tooltipText)

  try{IPElement.parentNode.replaceChild(container, IPElement)}
  catch{ //nvrmind
  }
}




async function handleIPelement(e){
  if (e.parentElement.parentElement.parentElement.querySelector("#EXTENSIONlink") || e.parentElement.parentElement.innerHTML.includes("locate IP")){
    return
  }
    const ip = e.innerText
    const info = await getInfo(ip)
    if (!info){
        return
    }
    const lat = info.latitude
    const lon = info.longitude
    const link = `https://www.google.com/maps?q=${lat},${lon}`
    addLink(e,link, formatJSON({country: info.countryName, region: info.regionName, city: info.cityName, zipArea: info.zipCode}))
    try{window.alreadyHandled.push(e.innerHTML)}
    catch {
      //nvrmind
    }
}


function scanPage(){
  const allIPsInPage = getAllIPSandWrapEm()
  for (const element of allIPsInPage){
      handleIPelement(element)
  }
}


///////////////////////////////////////////
//////////////////////////////////////////



// dont scan if page in black list

let y = chrome.storage.sync.get(['EXTENSIONneverUse'],  function (result) {
  return result
});





// /*
// This will run in each page
// */



const observer = new MutationObserver((mutationsList, observer) => {
  const selection = window.getSelection().toString()
  if  (selection){
    return // otherwise it doesnt let you select texts
  }
    observer.disconnect(); 
    scanPage()
    observer.observe(document.body, {
      childList: true,
     subtree: true
});
    

});

observer.observe(document.body, {
  childList: true,
  subtree: true
});