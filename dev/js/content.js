'use strict';

// fixed bug on file name change,
// hide on audio delete/show on restore,

// TODO Add bitrate and file size
// TODO Add cat api
// TODO Поправить логотипчик котейки

// TODO Handle multiple downloads at the same time
// TODO Fix player jump

// Model
// ----------------------------------------------------

let m_audioRows         = document.body.getElementsByClassName('audio_row'),
    m_svkBtnHtml        = '<div class="svk-btn"></div>',
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
    },

    m_decrypt           = (() =>{
        let a = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMN0PQRSTUVWXYZO123456789+/=",
            s = {
                v: t => t.split("").reverse().join(""),
                r: (t, i) =>{
                    t = t.split("");
                    for(let e, o = a + a, s = t.length; s--;)
                        e = o.indexOf(t[s]),
                        ~e && (t[s] = o.substr(e - i, 1));
                    return t.join("")
                },
                x: (t, i) =>{
                    let e = [];

                    i = i.charCodeAt(0);

                    t.split("").forEach(function(o){
                        e.push(String.fromCharCode(o.charCodeAt(0) ^ i))
                    });

                    return e.join("");
                }
            },
            o = t =>{
                if(!t || t.length % 4 === 1)
                    return !1;

                let r = "";
                for(let i, e, o = 0, s = 0; e = t.charAt(s++);){
                    e = a.indexOf(e), ~e && (i = o % 4 ? 64 * i + e : e, o++ % 4) && (r += String.fromCharCode(255 & i >> (-2 * o & 6)));
                }
                return r;
            };

        return t =>{
            if(~t.indexOf("audio_api_unavailable")){
                let i = t.split("?extra=")[1].split("#"),
                    e = o(i[1]);

                i = o(i[0]);

                if(!e || !i)
                    return t;

                e = e.split(String.fromCharCode(9));

                for(let a, r, l = e.length; l--;){
                    r = e[l].split(String.fromCharCode(11));
                    a = r.splice(0, 1, i)[0];

                    if(!s[a])
                        return t;

                    i = s[a].apply(null, r);
                }

                if(i && "http" === i.substr(0, 4))
                    return i;
            }
            return t
        };
    })();

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

    c_getAudioData            = (audioId, extended = false) => new Promise((resolve, reject) =>{
        let request = new XMLHttpRequest();

        request.open('POST', 'https://vk.com/al_audio.php');
        request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        request.setRequestHeader('X-Requested-With', "XMLHttpRequest");
        request.addEventListener('load', onLoad);
        request.addEventListener('error', reject);
        request.send('act=reload_audio&al=1&ids=' + audioId);

        // ----------------------------------------------------

        function onLoad(){
            // Quit if request was not successfull
            if(request.status !== 200){
                console.warn("[svk]: Couldn't get data from /al_audio.php - request status not 200");
                reject();
                return;
            }

            let audioData = c_getAudioDataFromRespose(request.responseText);

            // Quit if no audio data
            if(!audioData){
                reject();
                return;
            }

            if(extended)
                c_extendAudioData(audioData).then((audioData =>{
                    resolve(audioData);
                }), reject);
            else
                resolve(audioData);
        }
    }),

    c_extendAudioData         = audioData => new Promise((resolve, reject) =>{
        let request = new XMLHttpRequest();

        request.open('GET', audioData.url);
        request.setRequestHeader('Range', 'bytes=0-0');
        request.addEventListener('load', onLoad);
        request.addEventListener('error', onError);
        request.send();

        function onLoad(){
            if(request.status >= 200 && request.status < 300){

                let bytes = +request.getResponseHeader('Content-Range').split('/')[1],
                    mb    = (bytes / (1024 * 1024)).toFixed(1),
                    kbit  = bytes / 128,
                    kbps  = Math.ceil(Math.round(kbit / audioData.duration) / 16) * 16;

                // Update data
                audioData.size    = mb + ' MB';
                audioData.bitrate = kbps;

                resolve(audioData);
            }
            else {
                console.warn("[svk]: Audio file is not reachable");
                reject({
                    status    : request.status,
                    statusText: request.statusText
                });
            }
        }

        function onError(){
            reject({
                status    : request.status,
                statusText: request.statusText
            });
        }
    }),

    c_getAudioDataFromRespose = responseText =>{
        try {
            let jsonString     = responseText.split('<!json>')[1].split('<!>')[0],
                audioDataArr   = JSON.parse(jsonString)[0],
                filenameUnsafe = `${audioDataArr[4]} - ${audioDataArr[3]}.mp3`,
                filename       = m_decodeHtml(filenameUnsafe).replace(/[<>:"\/\\|?*]+/g, '').trim();

            return {
                url     : m_decrypt(audioDataArr[2]),
                duration: audioDataArr[5],
                filename
            }

        } catch(e){
            console.warn("[svk]: Couldn't get url from data");
        }
    },

    c_insertAfter             = (elem, refElem) => refElem.parentNode.insertBefore(elem, refElem.nextSibling),

    c_isSvkBtnAdded           = audioRow => !!audioRow.querySelector('.svk-btn'),

    c_isInfoAdded             = audioRow => !!audioRow.querySelector('.svk-bitrate'),

    c_getAudioIdFromRow       = audioRow => audioRow.getAttribute('data-full-id'),

    c_getAudioRowCover        = audioRow => audioRow.querySelector('.audio_row__cover_back'),

    c_getCurrentAudioId       = () =>{
        try {
            let storageAudioData = localStorage.getItem('audio_v20_track');

            if(!storageAudioData){
                console.warn("[svk]: No current audio data in storage");
                return;
            }

            let audioDataArr = JSON.parse(storageAudioData);
            return audioDataArr[1] + '_' + audioDataArr[0];

        } catch(e){
            console.warn("[svk]: Couldn't get current audio id from data");
        }
    },

    c_getNewSvkBtn            = () => m_htmlToEl(m_svkBtnHtml),

    c_getAudioRows            = () => m_audioRows,

    c_downloadAudio           = audioData =>{
        let {filename, url} = audioData;

        chrome.runtime.sendMessage({
            action: 'downloadAudio',
            data  : {filename, url}
        });
    };

// View
// ----------------------------------------------------

let v_editedAudioRow     = null,

    v_init               = () =>{
        v_render();

        let watch = setInterval(c_watchAudioRowsChange, 500);

        // Watch only if window is active
        window.addEventListener('blur', () => clearInterval(watch));
        window.addEventListener('focus', () =>{
            clearInterval(watch);
            setInterval(c_watchAudioRowsChange, 500);
        });

        // Track audio edit save
        document.addEventListener('click', v_onAudioEditSave);

        // Track audio cover click
        document.addEventListener('click', v_onPlayerCoverClick);
    },

    v_render             = () =>{

        // Quit if no items to render
        if(!c_getAudioRows().length)
            return;

        // Add download buttons, bind click event
        [].forEach.call(c_getAudioRows(), v_addSvkBtn);
    },

    v_addSvkBtn          = audioRow =>{

        // Quit if button has been already added
        if(c_isSvkBtnAdded(audioRow))
            return;

        // ----------------------------------------------------

        let audioRowCover = c_getAudioRowCover(audioRow),
            svkBtn        = c_getNewSvkBtn(),
            editBtn       = audioRow.querySelector('#edit');

        // Insert button after cover
        c_insertAfter(svkBtn, audioRowCover);

        // Remember that button added
        audioRow.classList.add('svk-btn-added');

        // Write id to button
        svkBtn.setAttribute('data-svk-id', c_getAudioIdFromRow(audioRow));

        // Bind events
        svkBtn.addEventListener('click', v_onSvkBtnClick);
        //editBtn.addEventListener('mouseover', v_onAudioEditHover);
        // audioRow.addEventListener('mouseenter', v_onAudioRowHover);
    },

    v_removeSvkBtn       = audioRow =>{

        // Quit if no active edited row
        if(!v_editedAudioRow)
            return;

        // ----------------------------------------------------

        let svkBtn = audioRow.querySelector('.svk-btn');

        // Remove if added
        svkBtn && svkBtn.remove();

        audioRow.classList.remove('svk-btn-added');
    },

    v_addAudioInfo       = (audioRow, audioData) =>{
        let audioDuration = audioRow.querySelector('.audio_duration');

        // Exit if info added
        if(c_isInfoAdded(audioRow))
            return;

        audioDuration.insertAdjacentHTML('beforebegin', `<div class="svk-bitrate">${audioData.bitrate}</div>`);
        audioDuration.insertAdjacentHTML('beforebegin', `<div class="svk-size">${audioData.size}</div>`);

        // Remember that audio info added
        audioRow.classList.add('svk-info-added');
    },

    v_onPlayerCoverClick = e =>{
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

        // Get data -> download
        // ----------------------------------------------------

        c_getAudioData(audioId).then(
            audioData => c_downloadAudio(audioData),
            () => v_showWarning(coverBtn)
        );
    },

    v_onSvkBtnClick      = e =>{
        e.stopPropagation();

        let svkBtn = e.target;

        // Quit if warning is showing
        // ----------------------------------------------------

        if(svkBtn.classList.contains('--error'))
            return;

        // Get data -> download
        // ----------------------------------------------------

        c_getAudioData(svkBtn.getAttribute('data-svk-id')).then(
            audioData => c_downloadAudio(audioData),
            () => v_showWarning(svkBtn)
        );
    },

    v_onAudioRowHover    = e =>{
        let audioRow      = e.target;

        // ----------------------------------------------------

        // Exit on claimed and deleted
        if(audioRow.classList.contains('claimed') || audioRow.classList.contains('audio_deleted'))
            return;

        // Exit if info added
        if(c_isInfoAdded(audioRow))
            return;

        // ----------------------------------------------------

        c_getAudioData(c_getAudioIdFromRow(audioRow), true).then(
            audioData => v_addAudioInfo(audioRow, audioData),
            () => void 0 // Do nothing on error
        );
    },

    v_onAudioEditSave    = e =>{
        // If clicked on save button
        if(e.target.id === 'audio_save_btn'){
            v_removeSvkBtn(v_editedAudioRow);
            setTimeout(v_render, 350);
        }
    },

    v_onAudioEditHover   = e => v_editedAudioRow = e.target.closest('.audio_row'),

    v_showWarning = btn =>{
        clearTimeout(btn.svkWarningTimer);

        btn.classList.remove('--error');
        btn.classList.add('--error');

        btn.svkWarningTimer = setTimeout(function(){
            btn.classList.remove('--error');
        }, 700);
    };

// ----------------------------------------------------

c_init();