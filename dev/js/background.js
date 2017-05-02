'use strict';

// TODO Handle download error

chrome.browserAction.onClicked.addListener(tab =>{
    let openInCurrentTab = (tab.url === 'chrome://newtab/' || tab.url === 'about:blank');

    if(openInCurrentTab)
        chrome.tabs.update(tab.id, {
            url: 'https://vk.com/audio'
        });
    else
        chrome.tabs.create({
            url  : "https://vk.com/audio",
            index: ++tab.index
        });
});

chrome.runtime.onMessage.addListener(message =>{
    if(message.action === 'downloadAudio')
        chrome.downloads.download(message.data);
});