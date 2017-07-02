'use strict';

// Controller
// ----------------------------------------------------

let c_init          = () =>{
        chrome.browserAction.onClicked.addListener(c_onIconClick);
        chrome.runtime.onMessage.addListener(c_onMessage);
    },

    c_onIconClick   = tab =>{
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
    },

    c_onMessage     = (message, sender) =>{
        if(message.event === 'downloadAudio')
            c_downloadAudio(message.data, sender.tab.id);
    },

    c_downloadAudio = (data, tabId) =>{
        let {filename, url, btnId} = data,
            ext                    = '.mp3';

        c_downloadFile(filename + ext, url).catch(_onFirstError);

        // ----------------------------------------------------

        function _onFirstError(error){
            // Try again on invalid filename
            if(error.message === 'Invalid filename')
                c_downloadFile(c_cleanFilename(filename) + ext, url).catch(_onError);
            else
                _onError(error);
        }

        function _onError(){
            // Send error to content script
            chrome.tabs.sendMessage(tabId, {
                event: 'downloadAudioFailed',
                data : {btnId}
            })
        }
    },

    c_downloadFile  = (filename, url) => new Promise((resolve, reject) =>{
        try {
            chrome.downloads.download({filename, url}, _onDownload);
        } catch(e){
            reject(e);
        }

        // ----------------------------------------------------

        function _onDownload(downloadId){
            if(downloadId)
                resolve(downloadId);
            else
                reject(chrome.runtime.lastError);
        }
    }),

    c_cleanFilename = filename =>{
        filename = filename.replace(/[^a-z0-9_\-()\[\] &]/gi, '').trim();
        return filename ? filename : '42 - Is the answer';
    };

// ----------------------------------------------------

c_init();