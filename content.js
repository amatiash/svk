'use strict';

let m, v, c;

// Model
// ----------------------------------------------------

m = {
    audioRows        : document.body.getElementsByClassName('audio_row'),
    svkBtnHtml       : '<div class="svk-btn">↓</div>',
    checkInterval    : 1000,
    lastAudioRowsHash: null,

    getAudioRowsHash: () =>{
        let length = m.audioRows.length,
            hash   = `${length}`;

        switch(length){
            case 0 :
                break;
            case 1 :{
                let firstEl     = m.audioRows[0],
                    firstElHash = m.isSvkBtnAdded(firstEl) + firstEl.getAttribute('data-full-id');

                hash += `-${firstElHash}`;
                break;
            }

            case 2 :
                let firstEl     = m.audioRows[0],
                    lastEl      = m.audioRows[length - 1],
                    firstElHash = m.isSvkBtnAdded(firstEl) + firstEl.getAttribute('data-full-id'),
                    lastElHash  = m.isSvkBtnAdded(lastEl) + lastEl.getAttribute('data-full-id');

                hash += `-${firstElHash}-${lastElHash}`;
                break;

            default:{
                let firstEl      = m.audioRows[0],
                    middleEl     = m.audioRows[Math.round(length / 2) - 1],
                    lastEl       = m.audioRows[length - 1],
                    firstElHash  = m.isSvkBtnAdded(firstEl) + firstEl.getAttribute('data-full-id'),
                    middleElHash = m.isSvkBtnAdded(middleEl) + middleEl.getAttribute('data-full-id'),
                    lastElHash   = m.isSvkBtnAdded(lastEl) + lastEl.getAttribute('data-full-id');

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

    isSvkBtnAdded        : m.isSvkBtnAdded,
    getAfterSvkBtnCounter: m.getAfterSvkBtnCounter,

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

            // If button not added
            if(!c.isSvkBtnAdded(audioRow)){

                let audioRowCounter = c.getAfterSvkBtnCounter(audioRowInner);

                // Insert button
                audioRowInner.insertAdjacentHTML('afterbegin', c.svkBtnHtml);

                // Hide .audio_row_counter
                if(audioRowCounter)
                    audioRowCounter.style.setProperty('display', 'none', 'important');

                // Bind event
                audioRowInner.firstElementChild.onclick = v.onSvkBtnClick;
            }
        });
    },

    onSvkBtnClick: function(e){
        e.stopPropagation();
        console.log('click');
    }
};

// ----------------------------------------------------

c.init();