let model, view, controller;

// Model
// ----------------------------------------------------

model = {
    init: () =>{
    },

};

// Controller
// ----------------------------------------------------

controller = {
    init: () =>{
        model.init();
        view.init();
    }
};

// View
// ----------------------------------------------------

view = {
    audioRows: document.body.getElementsByClassName('audio_row'),
    initTimer: {
        id      : undefined,
        passed  : 0,
        waitTime: 5000,
        interval: 200
    },
    btnHtml  : '<div class="audio_download_btn">↓</div>',

    init: () =>{
        // console.info('audioRows.length', view.audioRows.length);
        // console.info('initTimer.passed', view.initTimer.passed);

        // Delayed init if no audio items found
        // ----------------------------------------------------

        // If there items to render
        if(view.audioRows.length){
            clearTimeout(view.initTimer.id);
            view.render();
        }
        // Exit if no items found after the time
        else if(view.initTimer.passed >= view.initTimer.waitTime){
            return clearTimeout(view.initTimer.id);
        }
        // Check after the delay
        else {
            view.initTimer.id = setTimeout(view.init, view.initTimer.interval);
            view.initTimer.passed += view.initTimer.interval;
        }

        // ----------------------------------------------------

        // view.$content = $('#content');
        // view.$audioRows = view.$content.find('.audio_page__audio_rows_list .audio_row');
        // view.addDownloadBtns(view.$audioRows);
        // view.$content.on('click', '.audio_download_btn', view.onBtnClick)
    },

    render: function(){
        [].forEach.call(view.audioRows, audioRow =>{
            let audioRowInner = audioRow.querySelector('.audio_row_inner');

            // If button not added
            if(!audioRow.downloadButton){

                // Insert button
                audioRowInner.insertAdjacentHTML('afterbegin', view.btnHtml);

                // Add shortcut
                audioRow.downloadButton = audioRowInner.firstElementChild;

                // Bind event
                audioRow.downloadButton.onclick = view.onBtnClick;
            }
        });
    },

    onBtnClick: function(e){
        e.stopPropagation();
        console.log('click');
    }
};

// ----------------------------------------------------

controller.init();
