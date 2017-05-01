'use strict';

chrome.browserAction.onClicked.addListener(tab =>{
    chrome.tabs.create({
        url  : "https://vk.com/audio",
        index: ++tab.index
    });
});

chrome.runtime.onMessage.addListener(message =>{
    switch(message.action){
        case 'downloadAudio' : chrome.downloads.download(message.data);
    }
});