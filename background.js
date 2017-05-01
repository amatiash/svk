'use strict';

chrome.browserAction.onClicked.addListener(tab =>{
    chrome.tabs.create({
        url  : "https://vk.com/audio",
        index: ++tab.index
    });
});