import ifLog from '/js/consoleLogWrapper.js'

export default class Synth {
    constructor() {
        this.synth = window.speechSynthesis
    }

    speak(text) {
        if (this.synth.speaking) {
            console.error('speechSynthesis.speaking');
            return;
        }
        if (text !== '') {
            let utterThis = new SpeechSynthesisUtterance(text)
            utterThis.onend = function (event) {
                console.log('SpeechSynthesisUtterance.onend');
            }
            utterThis.onerror = function (event) {
                console.error('SpeechSynthesisUtterance.onerror');
            }
            this.synth.speak(utterThis);
        }
    }
}


