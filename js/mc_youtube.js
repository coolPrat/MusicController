var mc_button_map = [];

function recordState() {
    for (var i = 0; i < mc_button_map.length ; i++) {
        var currObj = mc_button_map[i];
        currObj.state = mc_youtube_isElementPresent(currObj.selectors);
    }
}

function loadMap(selectors) {
    for (var i = 0; i < selectors.length ; i++) {
        var newObj = null;
        newObj.name = selectors[i].operation;
        newObj.selectors = selectors[i].selector;
        newObj.state = false;
        mc_button_map.push(newObj);
    }
}

function getValue(selector) {
    return mc_button_map[selector];
}

function updateMap(selector, value) {
    mc_button_map[selector] = value;
}

function mc_youtube_click(selectorObj) {
    console.log(selectorObj);
    var flag = false;
    for (var i = 0; i < selectorObj.selector.length && !flag; i++) {
        try {
            document.querySelector(selectorObj.selector[i]).click();
            flag = true;
        } catch(e) {
            console.log("Exception " + i);
        }
    }
    if (!flag) {
        console.log("can't perform operation " + selectorObj.operation);
    }
}


function mc_youtube_isElementPresent(selectors) {
    var flag = false;
    for (var i = 0; i < selectors.length && !flag; i++) {
        try {
            element = document.querySelector(selectors[i]);
            if (element !== undefined && element !== null) {
                flag = (element.style.display === "none");
            }
        } catch(e) {
            console.log("Exception " + i);
        }
    }
    return flag;
}
