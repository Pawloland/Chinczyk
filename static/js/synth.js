import ifLog from '/js/consoleLogWrapper.js'

export default class Synth {
    constructor() {
        this.synth = window.speechSynthesis
    }

    speak(text) {
        if (this.synth.speaking) {
            ifLog.log('speechSynthesis.speaking');
            return;
        }
        if (text !== '') {
            let utterThis = new SpeechSynthesisUtterance(text)
            utterThis.onend = function (event) {
                ifLog.log('SpeechSynthesisUtterance.onend');
            }
            utterThis.onerror = function (event) {
                ifLog.error('SpeechSynthesisUtterance.onerror');
            }
            this.synth.speak(utterThis);
        }
    }
}


