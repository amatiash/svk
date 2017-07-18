'use strict';

// Controller
// ----------------------------------------------------

let c_init       = () =>{
        v_init();
    },

    c_getCatLink = () => new Promise((resolve, reject) =>{
        let request = new XMLHttpRequest();

        request.open('GET', 'http://thecatapi.com/api/images/get?format=xml&results_per_page=1&type=gif');
        request.addEventListener('load', onLoad);
        request.addEventListener('error', reject);
        request.send();

        // ----------------------------------------------------

        function onLoad(){
            // Quit if request was not successfull
            if(request.status !== 200){
                console.warn("[svk]: Bad cat api  - request status not 200");
                reject();
                return;
            }

            let xmlDocument = request.responseXML,
                url         = xmlDocument.querySelector('url').textContent;

            resolve(url);
        }
    }),

    c_isShared   = () => !!localStorage.getItem('svk-shared'),

    c_setShared  = () => localStorage.setItem('svk-shared', 'yes');

// View
// ----------------------------------------------------

let v_catImg,
    v_spinner,
    v_copyLinkBtn,
    v_catImg404,
    v_footer,

    v_init              = () =>{
        let lang = chrome.i18n.getUILanguage();

        // Fined nodes
        // ----------------------------------------------------

        v_catImg      = document.querySelector('.cat');
        v_spinner     = document.querySelector('.spinner');
        v_copyLinkBtn = document.querySelector('.copy-link-btn');
        v_catImg404   = document.querySelector('.cat404');
        v_footer      = lang === 'en-US' ? document.querySelector('.footer-en') : document.querySelector('.footer-ru');

        // Bind events
        // ----------------------------------------------------

        v_catImg.onload       = v_onCatImgLoad;
        v_catImg.onerror      = v_onCatImgLoadFail;
        v_footer.onclick      = v_onShareLinkClick;
        v_copyLinkBtn.onclick = () => document.execCommand('copy');
        document.addEventListener('copy', v_copyCatLink);

        // Set text
        // ----------------------------------------------------

        v_copyLinkBtn.innerText = chrome.i18n.getMessage("copyLinkText");

        // Get cat
        // ----------------------------------------------------

        c_getCatLink().then(v_onCatLinkReseived, v_onCatImgLoadFail);
    },

    /** Copy link to clipboard */
    v_copyCatLink       = e =>{
        e.preventDefault();
        e.clipboardData.setData('text/plain', v_catImg.src);
        v_copyLinkBtn.innerText = chrome.i18n.getMessage("copyLinkTextCopied");
    },

    /** Got link */
    v_onCatLinkReseived = catUrl =>{
        v_catImg.src = catUrl;
    },

    /** Cat loaded */
    v_onCatImgLoad      = () =>{
        v_spinner.classList.add('hidden');
        v_catImg.classList.remove('hidden');
        v_copyLinkBtn.classList.remove('hidden');
        v_showFooter();
    },

    /** Cat load failed */
    v_onCatImgLoadFail  = () =>{
        v_spinner.classList.add('hidden');
        v_catImg404.src = 'img/404cat.jpg';
        v_catImg404.classList.remove('hidden');
    },

    v_onShareLinkClick  = e =>{
        if(e.target.nodeName === 'A')
            c_setShared();
    },

    v_showFooter        = () =>{
        if(c_isShared())
            return;

        v_footer.classList.remove('hidden');
    };

// ----------------------------------------------------

c_init();
