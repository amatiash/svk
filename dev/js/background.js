'use strict';

// TODO Handle download error

chrome.browserAction.onClicked.addListener(tab =>{
    chrome.tabs.create({
        url  : "https://vk.com/audio",
        index: ++tab.index
    });
});

chrome.runtime.onMessage.addListener(message =>{
    if(message.action === 'downloadAudio')
        chrome.downloads.download(message.data);
});