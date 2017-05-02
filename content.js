'use strict';

let m, v, c;

// Model
// ----------------------------------------------------

m = {
    audioRows        : document.body.getElementsByClassName('audio_row'),
    audioPlayers     : document.body.getElementsByClassName('audio_page_player'),
    svkBtnHtml       : '<div class="svk-btn svk-btn--row"></div>',
    checkInterval    : 500,
    lastAudioRowsHash: null,

    getAudioId: audioRow => audioRow.getAttribute('data-full-id'),

    getAudioRowsHash: () =>{
        let length = m.audioRows.length,
            hash   = `${length}`;

        switch(length){
            case 0 :
                break;
            case 1 :{
                let firstEl     = m.audioRows[0],
                    firstElHash = m.isSvkBtnAdded(firstEl) + m.getAudioId(firstEl);

                hash += `-${firstElHash}`;
                break;
            }

            case 2 :
                let firstEl     = m.audioRows[0],
                    lastEl      = m.audioRows[length - 1],
                    firstElHash = m.isSvkBtnAdded(firstEl) + m.getAudioId(firstEl),
                    lastElHash  = m.isSvkBtnAdded(lastEl) + m.getAudioId(lastEl);

                hash += `-${firstElHash}-${lastElHash}`;
                break;

            default:{
                let firstEl      = m.audioRows[0],
                    middleEl     = m.audioRows[Math.round(length / 2) - 1],
                    lastEl       = m.audioRows[length - 1],
                    firstElHash  = m.isSvkBtnAdded(firstEl) + m.getAudioId(firstEl),
                    middleElHash = m.isSvkBtnAdded(middleEl) + m.getAudioId(middleEl),
                    lastElHash   = m.isSvkBtnAdded(lastEl) + m.getAudioId(lastEl);

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

    decodeHtml: html =>{
        let txt       = document.createElement("textarea");
        txt.innerHTML = html;
        return txt.value;
    },

    get audioPlayer(){ return m.audioPlayers[0] }
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

    getAudioId             : m.getAudioId,
    isSvkBtnAdded          : m.isSvkBtnAdded,
    getAfterSvkBtnCounter  : m.getAfterSvkBtnCounter,
    getAudioDataFromRespose: m.getAudioDataFromRespose,

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
    },

    render: function(){

        // Quit if no items to render
        if(!c.audioRows.length)
            return;

        // Add download buttons, bind click enent
        [].forEach.call(c.audioRows, audioRow =>{
            let audioRowInner = audioRow.children[0];

            audioRow.addEventListener('click', v.onAudioRowClick);

            // If button not added
            if(!c.isSvkBtnAdded(audioRow)){

                let audioRowCounter = c.getAfterSvkBtnCounter(audioRowInner);

                // Insert button
                audioRowInner.insertAdjacentHTML('afterbegin', c.svkBtnHtml);

                // Hide .audio_row_counter
                if(audioRowCounter)
                    audioRowCounter.style.setProperty('display', 'none', 'important');

                // Write id to button and bind event
                {
                    let svkBtn = audioRowInner.firstElementChild;

                    svkBtn.setAttribute('data-svk-id', c.getAudioId(audioRow));
                    svkBtn.addEventListener('click', v.onSvkBtnClick);
                }

            }
        });
    },

    onAudioRowClick: function(){
        let audioRow  = this,
            isPlaying = audioRow.classList.contains('audio_row_playing');

        console.log(m.audioPlayer, isPlaying);
    },

    onSvkBtnClick: function(e){
        e.stopPropagation();

        let svkBtn      = this,
            request     = new XMLHttpRequest(),
            requestBody = 'act=reload_audio&al=1&ids=' + svkBtn.getAttribute('data-svk-id');

        // ----------------------------------------------------

        // Quit if warning is showing
        if(svkBtn.classList.contains('--error'))
            return;

        // ----------------------------------------------------

        request.open('POST', '/al_audio.php');
        request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        request.addEventListener('load', () => v.onAudioDataReceived(request, svkBtn));
        request.addEventListener('error', () => v.showWarning(svkBtn));
        request.send(requestBody);

        // ----------------------------------------------------
    },

    onAudioDataReceived: (request, svkBtn) =>{
        if(request.status === 200){
            let audioData = c.getAudioDataFromRespose(request.responseText);

            if(audioData)
                c.downloadAudio(audioData);
            else
                v.showWarning(svkBtn);
        }
        else
            v.showWarning(svkBtn);
    },

    showWarning: (() =>{
        let warningTimer;

        return svkBtn =>{
            clearTimeout(warningTimer);

            svkBtn.classList.remove('--error');
            svkBtn.classList.add('--error');

            warningTimer = setTimeout(function(){
                svkBtn.classList.remove('--error');
            }, 700);
        };
    })()
};

// ----------------------------------------------------

c.init();