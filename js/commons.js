var model = null;
var dataLoaded = false;
var globalPlayList = [];
var buttonPresent = null;

function addMCScript(tab) {
    var domain = getDomain(tab);
    var scriptName = "mc_" + domain + ".js";
    chrome.tabs.executeScript(tab.id, {file: "js/" + scriptName});
}


function loadData(flag) {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function(){
        if (xhr.readyState == 4 && xhr.status == 200) {
            model = JSON.parse(xhr.responseText);
            flag.value = true;
        }
    };
    xhr.open("GET", chrome.extension.getURL('../js/model.json'), false);
    xhr.send();
}

function getPlaylist() {
    chrome.bookmarks.getChildren(model.playlist_id, function(songList) {
        for (var i = 0; i < songList.length; i++) {
            globalPlayList.push(songList[i].url);
        }
    });
}


function isSupported(tab) {
    var domain = getDomain(tab);
    return (model.supportedList.indexOf(domain) != -1);
}

function getDomain(tab) {
    var domain = "";
    var url = tab.url;
    var wIndex = url.indexOf("www.");
    if (wIndex > 0) {
        domain = url.substring(wIndex + 4, url.indexOf(".", wIndex + 4));
    } else {
        var httpIndex = url.indexOf("http://");
        if (httpIndex > 0) {
            domain = url.substring(httpIndex + 6, url.indexOf(".", httpIndex + 6));
        } else {
            var httpsIndex = url.indexOf("https://");
            domain = url.substring(httpIndex + 7, url.indexOf(".", httpIndex + 7));
        }
    }
    return domain;
}

function checkAndCreatePlaylist() {
    chrome.bookmarks.search({title: "MC Playlist"}, function(bookmarks) {
        if (bookmarks.length === 0) {
            chrome.bookmarks.create({title: "MC Playlist"}, function(bookmark){
                console.log("Playlist created");
                model.playlist_id = bookmark.id;
            });
        } else {
            model.playlist_id = bookmarks[0].id;
        }
    });
}

function makeAnimation(name, len) {
    var cssFiles = document.styleSheets;
    var keyframesRule = "@keyframes moveText" + name + " { from {left:301px;} to {left: -" + (len * 15) + "px;} }";
    var classRule = ".movingText" + name + "{";
    classRule +=    "animation-name: moveText" + name +";";
    classRule +=    " animation-duration: " + (len  / 5) +"s; ";
    classRule +=    " }";


    for (var i = 0; i < cssFiles.length; i++) {
      if (cssFiles[i].href.toString().indexOf(model.cssFile) != -1) {
        cssFiles[i].insertRule(classRule);
        cssFiles[i].insertRule(keyframesRule);
      }
    }
}

function changeTabTo(tab) {
    var winId = tab.getAttribute("data-winId");
    var tabId = tab.getAttribute("data-tabId");
    chrome.windows.update(parseInt(winId), {focused:true});
    chrome.tabs.update(parseInt(tabId), {active: true});
}

function getPlayer(tab, windowId) {
    var player = document.createElement("div");
    player.setAttribute("class","player");
    var icon = makeIcon(tab, windowId);
    var item = makeItem(tab);
    var buttons = makeButtons(tab);

    player.appendChild(icon);
    player.appendChild(item);
    player.appendChild(buttons);

    return player;
}

function makeIcon(tab, windowId) {

    var playerIcon = document.createElement("img");
    playerIcon.setAttribute("class","playerIcon");
    playerIcon.id = "playerIcon";
    var domain = getDomain(tab);
    playerIcon.setAttribute("src", "../img/" + domain + ".png");
    playerIcon.setAttribute("alt", domain + "->");
    playerIcon.setAttribute("data-winId", windowId);
    playerIcon.setAttribute("data-tabId", tab.id);

    playerIcon.addEventListener('click', function() {
      changeTabTo(playerIcon);
    });

    return playerIcon;
}

function makeItem(tab) {
    var playerItem = document.createElement("div");
    playerItem.setAttribute("class","playerItem");

    var playerElement = document.createElement("p");
    if (tab.title.length  > 15) {
      makeAnimation(tab.id, tab.title.length);
      playerElement.setAttribute("class","movingText movingText"+tab.id);
    }

    playerElement.appendChild(document.createTextNode(tab.title));
    playerItem.appendChild(playerElement);

    return playerItem;
}

function makeButtons(tab) {
    var buttonsHolder = document.createElement("div");
    buttonsHolder.setAttribute("class", "buttonsHolder");
    var buttons = getButtons(tab);
    buttonsHolder.appendChild(buttons);
    // mcButtons = getMcButtons(tab);
    // buttonsHolder.appendChild(mcButtons);
    return buttonsHolder;
}

function getButtons(tab) {
    var domain = getDomain(tab);
    var buttonName = domain + "_buttons";
    var buttons = model.button_sequence;
    var domainButtons = model[buttonName];

    var buttonsList = document.createElement("div");
    buttonsList.setAttribute("class", "buttonsList");

    for (var i = 0; i < buttons.length; i++) {
        var buttonType = buttons[i];
        var button = document.createElement("div");
        button.setAttribute("class", "button");

        var isPresent = getIsPresentFunctionOk(domain, buttonType, domainButtons[buttonType]);

        // TODO: load data and then use it here
        // chrome.tabs.executeScript(tab.id, {code : isPresent}, function(result){
        //     if (result[0]) {
        //         console.log("aala");
        //     }
        // });

        var buttonImg = getButtonIcon(buttonType);

        var selectorObj = {operation: buttonType, selector: domainButtons[buttonType]};

        // selectorObj = new SelectorObj(buttonType, domainButtons[buttonType]);

        buttonImg.onclick = sendClickCommand(tab ,selectorObj);
        // buttonImg.onclick = temp(tab, i);

        button.appendChild(buttonImg);
        buttonsList.appendChild(button);
    }

    return buttonsList;
}

function temp(result) {
    console.log(result);
    buttonPresent = result[0];
}

function getIsPresentFunctionOk(domain, buttonType, domainButtons) {
    codeLine = 'mc_' + domain + '_isElementPresent(';
    if (domainButtons.constructor.name === "Array") {
        codeLine += '["' + domainButtons.join().replace(/,/g, '","') + '"]';
    } else {
        codeLine += domainButtons;
    }
    codeLine += ');';

    codeLineString = new String(codeLine);

    return codeLineString.valueOf();
}

function sendClickCommand(tab, selector) {

    domain = getDomain(tab);
    codeLine = 'mc_' + domain + '_click({operation: "' + selector.operation + '", selector: ';
    if (selector.selector.constructor.name === "Array") {
        codeLine += '["' + selector.selector.join().replace(/,/g, '","') + '"]';
    } else {
        codeLine += selector.selector;
    }
    codeLine += '});';

    // codeLine = 'mc_' + domain + '_click(' + selector.toString() + ');';

    var codeToSend = new String(codeLine);
    return function(){chrome.tabs.executeScript(tab.id, {code : codeToSend.valueOf()});};

    // return function(){chrome.tabs.executeScript(tab.id, {code : 'mc_' + domain + '_click(' + selector.toString() + ');'});};
}

function getButtonIcon(type) {
    var button = document.createElement("img");
    button.setAttribute("class", "button-icon mc_" + type);
    button.setAttribute("src", "../img/mc-" + type + "-button.png");
    return button;
}


function getMcButtons(tab) {

    // console.log(globalPlayList);
    // console.log(globalPlayList[0]);
    // console.log(globalPlayList.indexOf(tab.url));

    if (globalPlayList.indexOf(tab.url) != -1) {
        button.setAttribute("class", "button-icon mc_remove_playlist");
        button.setAttribute("src", "../img/mc-remove-playlist-button.png");
        button.onclick = getRemovePlatlistFunc(tab);
    } else {
        button.setAttribute("class", "button-icon mc_add_playlist");
        button.setAttribute("src", "../img/mc-add-playlist-button.png");
        button.onclick = getAddPlatlistFunc(tab);
    }

    // console.log(button);
    return button;
}


function getAddPlatlistFunc(tab) {
    return "chrome.bookmarks.create({parentId:'" + model.playlist_id + "', title:'" + tab.title + "', url: '" + tab.url + "'}, function(){console.log('" + tab.title +" added in playlist');});";
    // chrome.bookmarks.create({title: "MC Playlist"}, function(){console.log("Playlist created");});
}

function getRemovePlatlistFunc(tab) {

    var id = 0;
    chrome.bookmarks.search({parentId:model.playlist_id, url: tab.url}, function(bookmark){
        id = bookmark.id;
    });
    console.log(id);
    return "chrome.bookmarks.remove('" + id +"', function(){console.log('"+ tab.title +" removed from playlist')});";
}

function SelectorObj(operation, selectors) {
    this.operation = operation;
    this.selectors = selectors;
    this.toString = function() {
        var objString = "{operation : " + this.operation +", selector: " + this.getSelectorString() +  "}";
        return objString;
    };
    this.getSelectorString = function() {
        var selectorString = "";
        if (this.selectors.constructor.name === "Array") {
            selectorString += '["' + this.selectors.join().replace(/,/g, '","') + '"]';
        } else {
            selectorString += this.selectors;
        }
        return selectorString;
    };
}
