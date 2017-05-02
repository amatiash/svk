'use strict';

let m, v, c;

// Model
// ----------------------------------------------------

m = {
    audioRows        : document.body.getElementsByClassName('audio_row'),
    svkBtnHtml       : '<div class="svk-btn svk-btn--row"></div>',
    checkInterval    : 500,
    lastAudioRowsHash: null,

    getAudioIdFromRow: audioRow => audioRow.getAttribute('data-full-id'),

    getCurrentAudioId: () =>{
        try {
            let audioDataArr = JSON.parse(localStorage.getItem('audio_v20_track'));
            return audioDataArr[1] + '_' + audioDataArr[0];

        } catch(e){
            console.warn("[svk]: Couldn't get current audio id");
            console.error(e);
        }
    },

    getAudioRowsHash: () =>{
        let length = m.audioRows.length,
            hash   = `${length}`;

        switch(length){
            case 0 :
                break;
            case 1 :{
                let firstEl     = m.audioRows[0],
                    firstElHash = m.isSvkBtnAdded(firstEl) + m.getAudioIdFromRow(firstEl);

                hash += `-${firstElHash}`;
                break;
            }

            case 2 :
                let firstEl     = m.audioRows[0],
                    lastEl      = m.audioRows[length - 1],
                    firstElHash = m.isSvkBtnAdded(firstEl) + m.getAudioIdFromRow(firstEl),
                    lastElHash  = m.isSvkBtnAdded(lastEl) + m.getAudioIdFromRow(lastEl);

                hash += `-${firstElHash}-${lastElHash}`;
                break;

            default:{
                let firstEl      = m.audioRows[0],
                    middleEl     = m.audioRows[Math.round(length / 2) - 1],
                    lastEl       = m.audioRows[length - 1],
                    firstElHash  = m.isSvkBtnAdded(firstEl) + m.getAudioIdFromRow(firstEl),
                    middleElHash = m.isSvkBtnAdded(middleEl) + m.getAudioIdFromRow(middleEl),
                    lastElHash   = m.isSvkBtnAdded(lastEl) + m.getAudioIdFromRow(lastEl);

                hash += `-${firstElHash}-${middleElHash}-${lastElHash}`;
                break;
            }
        }

        return hash;

    },

    isSvkBtnAdded: audioRow => audioRow.children[0].firstElementChild.classList.contains('svk-btn'),

    getAfterSvkBtnCounter: audioRowInner =>{
        let el = audioRowInner.firstElementChild;

        // If there is a counter
        if(el.classList.contains('audio_row_counter'))
            return el;
    },

    getAudioDataFromRespose: data =>{
        try {
            let jsonString   = data.split('<!json>')[1].split('<!>')[0],
                audioDataArr = JSON.parse(jsonString)[0],
                linkURL      = new URL(audioDataArr[2]);

            return {
                url     : linkURL.origin + linkURL.pathname,
                filename: m.decodeHtml(`${audioDataArr[4]} - ${audioDataArr[3]}.mp3`)
            }

        } catch(e){
            console.warn("[svk]: Couldn't get url from data");
            console.error(e);
        }
    },

    getIdRequestBody: audioId => 'act=reload_audio&al=1&ids=' + audioId,

    decodeHtml: html =>{
        let txt       = document.createElement("textarea");
        txt.innerHTML = html;
        return txt.value;
    }
};

// Controller
// ----------------------------------------------------

c = {
    init: () =>{
        v.init();
    },

    watchAudioRowsChange: () =>{
        let hash = m.getAudioRowsHash();

        // If audio list changed
        if(hash !== m.lastAudioRowsHash){
            v.render();
            m.lastAudioRowsHash = m.getAudioRowsHash();
        }
    },

    downloadAudio: audioData =>{
        chrome.runtime.sendMessage({
            action: 'downloadAudio',
            data  : audioData
        });
    },

    sendGetAudioDataRequest: (body, onLoad, onError) =>{
        let request = new XMLHttpRequest();

        request.open('POST', '/al_audio.php');
        request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        request.addEventListener('load', () => onLoad(request));
        request.addEventListener('error', onError);
        request.send(body);
    },

    getAudioIdFromRow      : m.getAudioIdFromRow,
    isSvkBtnAdded          : m.isSvkBtnAdded,
    getAfterSvkBtnCounter  : m.getAfterSvkBtnCounter,
    getAudioDataFromRespose: m.getAudioDataFromRespose,
    getCurrentAudioId      : m.getCurrentAudioId,
    getIdRequestBody       : m.getIdRequestBody,

    get audioRows(){ return m.audioRows },
    get svkBtnHtml(){ return m.svkBtnHtml },
    get checkInterval(){ return m.checkInterval }
};

// View
// ----------------------------------------------------

v = {

    init: () =>{
        v.render();
        setInterval(c.watchAudioRowsChange, c.checkInterval);

        // Track audio cover click
        document.addEventListener('click', v.onPlayerCoverClick);
    },

    render: function(){

        // Quit if no items to render
        if(!c.audioRows.length)
            return;

        // Add download buttons, bind click event
        [].forEach.call(c.audioRows, audioRow =>{
            let audioRowInner = audioRow.children[0];

            // Quit if button has been already added
            // ----------------------------------------------------

            if(c.isSvkBtnAdded(audioRow))
                return;

            // ----------------------------------------------------

            let audioRowCounter = c.getAfterSvkBtnCounter(audioRowInner);

            // Insert button
            audioRowInner.insertAdjacentHTML('afterbegin', c.svkBtnHtml);

            // Hide .audio_row_counter
            if(audioRowCounter)
                audioRowCounter.style.setProperty('display', 'none', 'important');

            // Write id to button and bind event
            {
                let svkBtn = audioRowInner.firstElementChild;

                svkBtn.setAttribute('data-svk-id', c.getAudioIdFromRow(audioRow));
                svkBtn.addEventListener('click', v.onSvkBtnClick);
            }
        });
    },

    onPlayerCoverClick: function(e){
        let coverBtn      = e.target,
            isDiv         = coverBtn.nodeName === 'DIV',
            isPlayerCover = coverBtn.classList.contains('audio_page_player__cover'),
            audioId;

        // ----------------------------------------------------

        // Quit if clicked outside player cover
        if(!(isDiv && isPlayerCover))
            return;

        // Quit if warning is showing
        if(coverBtn.classList.contains('--error'))
            return;

        // ----------------------------------------------------

        audioId = c.getCurrentAudioId();

        // If couldn't get audio id
        if(!audioId){
            v.showWarning(coverBtn);
            return;
        }

        // Send request
        // ----------------------------------------------------

        c.sendGetAudioDataRequest(
            c.getIdRequestBody(audioId),                            // requestBody
            request => v.onAudioDataReceived(request, coverBtn),    // onLoad
            () => v.showWarning(coverBtn)                           // onError
        );
    },

    onSvkBtnClick: function(e){
        e.stopPropagation();

        let svkBtn = this;

        // Quit if warning is showing
        // ----------------------------------------------------

        if(svkBtn.classList.contains('--error'))
            return;

        // Send request
        // ----------------------------------------------------

        c.sendGetAudioDataRequest(
            c.getIdRequestBody(svkBtn.getAttribute('data-svk-id')), // requestBody
            request => v.onAudioDataReceived(request, svkBtn),      // onLoad
            () => v.showWarning(svkBtn)                             // onError
        );
    },

    onAudioDataReceived: (request, btn) =>{

        // Quit if request was not successfull
        // ----------------------------------------------------

        if(request.status !== 200)
            return v.showWarning(btn);

        // ----------------------------------------------------

        let audioData = c.getAudioDataFromRespose(request.responseText);

        if(audioData)
            c.downloadAudio(audioData);
        else
            v.showWarning(btn);

    },

    showWarning: (() =>{
        let warningTimer;

        return btn =>{
            clearTimeout(warningTimer);

            btn.classList.remove('--error');
            btn.classList.add('--error');

            warningTimer = setTimeout(function(){
                btn.classList.remove('--error');
            }, 700);
        };
    })()
};

// ----------------------------------------------------

c.init();