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
