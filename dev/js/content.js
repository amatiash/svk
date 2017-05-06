'use strict';

// TODO Add bitrate and fise size
// TODO Convert to Promise

// Model
// ----------------------------------------------------

let m_audioRows         = document.body.getElementsByClassName('audio_row'),
    m_svkBtnHtml        = '<div class="svk-btn"></div>',
    m_checkInterval     = 500,
    m_lastAudioRowsHash = null,

    m_getAudioRowsHash  = () =>{
        let length = m_audioRows.length,
            hash   = `${length}`;

        switch(length){
            case 0 :
                break;
            case 1 :{
                let firstEl     = m_audioRows[0],
                    firstElHash = c_isSvkBtnAdded(firstEl) + c_getAudioIdFromRow(firstEl);

                hash += `-${firstElHash}`;
                break;
            }

            case 2 :
                let firstEl     = m_audioRows[0],
                    lastEl      = m_audioRows[length - 1],
                    firstElHash = c_isSvkBtnAdded(firstEl) + c_getAudioIdFromRow(firstEl),
                    lastElHash  = c_isSvkBtnAdded(lastEl) + c_getAudioIdFromRow(lastEl);

                hash += `-${firstElHash}-${lastElHash}`;
                break;

            default:{
                let firstEl      = m_audioRows[0],
                    middleEl     = m_audioRows[Math.round(length / 2) - 1],
                    lastEl       = m_audioRows[length - 1],
                    firstElHash  = c_isSvkBtnAdded(firstEl) + c_getAudioIdFromRow(firstEl),
                    middleElHash = c_isSvkBtnAdded(middleEl) + c_getAudioIdFromRow(middleEl),
                    lastElHash   = c_isSvkBtnAdded(lastEl) + c_getAudioIdFromRow(lastEl);

                hash += `-${firstElHash}-${middleElHash}-${lastElHash}`;
                break;
            }
        }

        return hash;

    },

    m_decodeHtml        = html =>{
        let txt       = document.createElement("textarea");
        txt.innerHTML = html;
        return txt.value;
    },

    m_htmlToEl          = html =>{
        let template       = document.createElement('template');
        template.innerHTML = html;
        return template.content.firstChild;
    };

// Controller
// ----------------------------------------------------

let c_init                    = () => v_init(),

    c_watchAudioRowsChange    = () =>{
        let hash = m_getAudioRowsHash();

        // If audio list changed
        if(hash !== m_lastAudioRowsHash){
            v_render();
            m_lastAudioRowsHash = m_getAudioRowsHash();
        }
    },

    c_downloadAudio           = audioData =>{
        chrome.runtime.sendMessage({
            action: 'downloadAudio',
            data  : audioData
        });
    },

    c_sendGetAudioDataRequest = (body, onLoad, onError) =>{
        let request = new XMLHttpRequest();

        request.open('POST', '/al_audio.php');
        request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        request.addEventListener('load', () => onLoad(request));
        request.addEventListener('error', onError);
        request.send(body);
    },

    c_insertAfter             = (elem, refElem) => refElem.parentNode.insertBefore(elem, refElem.nextSibling),

    c_isSvkBtnAdded           = audioRow => audioRow.classList.contains('svk-btn-added'),

    c_getAudioIdFromRow       = audioRow => audioRow.getAttribute('data-full-id'),

    c_getAudioRowCover        = audioRow => audioRow.querySelector('.audio_row_inner > .audio_row_cover_wrap'),

    c_getIdRequestBody        = audioId => 'act=reload_audio&al=1&ids=' + audioId,

    c_getAudioDataFromRespose = data =>{
        try {
            let jsonString     = data.split('<!json>')[1].split('<!>')[0],
                audioDataArr   = JSON.parse(jsonString)[0],
                linkURL        = new URL(audioDataArr[2]),
                filenameUnsafe = `${audioDataArr[4]} - ${audioDataArr[3]}.mp3`,
                filename       = m_decodeHtml(filenameUnsafe).replace(/[<>:"\/\\|?*]+/g, '');

            return {
                url: linkURL.origin + linkURL.pathname,
                filename
            }

        } catch(e){
            console.warn("[svk]: Couldn't get url from data");
            console.error(e);
        }
    },

    c_getCurrentAudioId       = () =>{
        try {
            let audioDataArr = JSON.parse(localStorage.getItem('audio_v20_track'));
            return audioDataArr[1] + '_' + audioDataArr[0];

        } catch(e){
            console.warn("[svk]: Couldn't get current audio id");
            console.error(e);
        }
    },

    c_getNewSvkBtn            = () => m_htmlToEl(m_svkBtnHtml),

    c_getAudioRows            = () => m_audioRows,

    c_CheckInterval           = () => m_checkInterval;

// View
// ----------------------------------------------------

let v_init                = () =>{
        v_render();
        setInterval(c_watchAudioRowsChange, c_CheckInterval());

        // Track audio cover click
        document.addEventListener('click', v_onPlayerCoverClick);
    },

    v_render              = () =>{

        // Quit if no items to render
        if(!c_getAudioRows().length)
            return;

        // Add download buttons, bind click event
        [].forEach.call(c_getAudioRows(), v_addSvkBtn);
    },

    v_addSvkBtn           = audioRow =>{

        // Quit if button has been already added
        if(c_isSvkBtnAdded(audioRow))
            return;

        // ----------------------------------------------------

        let audioRowCover = c_getAudioRowCover(audioRow),
            svkBtn        = c_getNewSvkBtn();

        // Insert button after cover
        c_insertAfter(svkBtn, audioRowCover);

        // Remember that button added
        audioRow.classList.add('svk-btn-added');

        // Write id to button and bind event
        svkBtn.setAttribute('data-svk-id', c_getAudioIdFromRow(audioRow));
        svkBtn.addEventListener('click', v_onSvkBtnClick);
    },

    v_onPlayerCoverClick  = function(e){
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

        audioId = c_getCurrentAudioId();

        // If couldn't get audio id
        if(!audioId){
            v_showWarning(coverBtn);
            return;
        }

        // Send request
        // ----------------------------------------------------

        c_sendGetAudioDataRequest(
            c_getIdRequestBody(audioId),                            // requestBody
            request => v_onAudioDataReceived(request, coverBtn),    // onLoad
            () => v_showWarning(coverBtn)                           // onError
        );
    },

    v_onSvkBtnClick       = function(e){
        e.stopPropagation();

        let svkBtn = this;

        // Quit if warning is showing
        // ----------------------------------------------------

        if(svkBtn.classList.contains('--error'))
            return;

        // Send request
        // ----------------------------------------------------

        c_sendGetAudioDataRequest(
            c_getIdRequestBody(svkBtn.getAttribute('data-svk-id')), // requestBody
            request => v_onAudioDataReceived(request, svkBtn),      // onLoad
            () => v_showWarning(svkBtn)                             // onError
        );
    },

    v_onAudioDataReceived = (request, btn) =>{

        // Quit if request was not successfull
        // ----------------------------------------------------

        if(request.status !== 200)
            return v_showWarning(btn);

        // ----------------------------------------------------

        let audioData = c_getAudioDataFromRespose(request.responseText);

        if(audioData)
            c_downloadAudio(audioData);
        else
            v_showWarning(btn);
    },

    v_showWarning         = (() =>{
        let warningTimer;

        return btn =>{
            clearTimeout(warningTimer);

            btn.classList.remove('--error');
            btn.classList.add('--error');

            warningTimer = setTimeout(function(){
                btn.classList.remove('--error');
            }, 700);
        };
    })();

// ----------------------------------------------------

c_init();