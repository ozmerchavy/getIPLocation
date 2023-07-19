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


  async function getInfo(ip){
    const y = await bgGET(`http://ip-api.com/json/${ip}`)
    let json
    try { json = JSON.parse(y)}
    catch{
        return undefined
    }
    return json
}



  
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
    linkElement.id = "EXTENSIONlink"
    linkElement.innerText = 'locate IP 🌍>>';
    linkElement.style.fontSize = 'x-small'; // Use 'x-small' for a smaller font size
    linkElement.style.marginLeft = '5px'; // Add a margin to separate from the element's content

    const container = document.createElement('span');
    container.style.display = 'inline-block';
    container.style.verticalAlign = 'top'; // Align the link with the top of the element's content

    // Wrap the element's content and the link in the container
    container.appendChild(IPElement.cloneNode(true));
    container.appendChild(linkElement);
    addTooltip(container, tooltipText)

    // Replace the original element with the container
    IPElement.parentNode.replaceChild(container, IPElement);
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
    window.alreadyHandled.push(e.innerHTML)

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


const maxIntervalsPerClick = 40;
window.clickInterval = 0

document.addEventListener('click', function() {
  window.intervalCount = 0;

  clearInterval(clickInterval);
  window.clickInterval = setInterval(function() {
    scanPage();

    intervalCount++;
    if (intervalCount >= maxIntervalsPerClick) {
      clearInterval(window.clickInterval);
    }
  }, 300);
});


scanPage()
