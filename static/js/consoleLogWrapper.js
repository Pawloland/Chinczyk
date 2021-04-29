// mój wrapper na console.log żeby można go było globalnie włączyć i wyłączyć
// co ważne, to nie zmienia on nr lini ani kolumny danego polecenia
//  wyświelającej się w konsoli, dzięki czemu można łatwiej debugować kod,
// bo pokazuje prawdziwe miejsce danego ifLog.log() w kodzie

class DebugLog {
    constructor() {
        if (log == true) {
            this.log = console.log.bind(window.console);
        } else {
            this.log = function () { return };
        }
        return this;
    }
}

let log = false
const ifLog = new DebugLog(log)
export default ifLog // to jest default export, czyli w script.js nie trzeba miec takiej samej nazwy jak ifLog, może być dowolna







