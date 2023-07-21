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
    const y = await getDataFromStorage(ip) || await bgGET(`http://ip-api.com/json/${ip}`)
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

  
function getIPsElementsInPage(){
    return [...document.querySelectorAll("*")].filter(x=>(/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/g).test(x.innerText))

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
  const whereTheHellIsThisLink = e.parentElement.parentElement.parentElement.querySelector("#EXTENSIONlink")
  if (e.parentElement.parentElement.parentElement.querySelector("#EXTENSIONlink")){
    return
  }
    const ip = e.innerText
    const info = await getInfo(ip)
    if (!info){
        return
    }
    const lat = info.lat
    const lon = info.lon
    const link = `https://www.google.com/maps?q=${lat},${lon}`
    addLink(e,link, formatJSON({country: info.country, region: info.regionName, city: info.city, zipArea: info.zip, IntenetServiceProvider: info.isp, organization: info.org}))
    try{window.alreadyHandled.push(e.innerHTML)}
    catch {
      //nvrmind
    }
}


function scanPage(){
  const allIPsInPage = getIPsElementsInPage()
  for (const element of allIPsInPage){
      handleIPelement(element)
  }
}


///////////////////////////////////////////
//////////////////////////////////////////

/*
This will run in each page
*/


window.amountoScan = 0

document.addEventListener('click', function() {
  window.amountoScan = 0
});



setInterval(async()=>{
  if (window.amountoScan<10){
    scanPage()
    window.amountoScan++
  }
}, 500) 


