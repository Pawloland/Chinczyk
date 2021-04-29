export default class Player { // tu będą dane odnosnie pionków, stanu itd
    constructor(color, nick, id, session, playboard) {
        this.session = session // połączenie z klasą session
        this.color = color
        this.nick = nick
        this.id = id
        this.status = false
        this.div = document.getElementById(color)
        this.timer_div = this.div.getElementsByClassName('timer')[0]
        this.timer_intervalID // ustawiane w startTimer()
        this.updateDivText()
    }

    updateDivText() {
        this.div.querySelector('span').innerText = this.nick
    }

    updateDivStatus() {
        if (this.status == true) {
            this.div.classList.remove('pale')
        } else {
            this.div.classList.add('pale')
        }
    }

    startTimer() {
        this.timer_div.innerText = parseInt((this.session.move_end_time - Date.now()) / 1000)
        this.timer_div.classList.remove('hidden')
        this.timer_intervalID = setInterval(async () => {
            if (parseInt((this.session.move_end_time - Date.now()) / 1000) < 0) {
                // nie mam bladego pojęcia dlaczego to nie działa 
                // powinno raz pobrać dane z serwera i zaktualizować przez to timery,
                // a zamiast tego jes tnieskończona pętla i pobiera w nieskończoność dane i zawiesza wszytsko

                // let server_data = await this.session.getCurrentData()
                // await intervalFunction(server_data)
                // this.timer_div.innerText = parseInt((this.session.move_end_time - Date.now()) / 1000)
            } else {
                this.timer_div.innerText = parseInt((this.session.move_end_time - Date.now()) / 1000)
            }
        }, 200)
    }

    stopTimer() {
        try {
            clearInterval(this.timer_intervalID)
        } finally {
            this.timer_div.classList.add('hidden')
        }
    }

}