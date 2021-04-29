import ifLog from '/js/consoleLogWrapper.js'

// klasa odpowiedzialana za komunikację z serwerem i podstawową zmianę wyglądu strony


export default class Session {
    constructor() {
        this.game_ended = false
        this.player_id = undefined // zapisywane w this.saveData(data)
        this.nick = undefined // zapisywane w this.saveData(data)
        this.session_id = undefined // zapisywane w this.saveData(data)
        this.player_color = undefined // zapisywane w this.saveData(data)
        this.places = undefined // pobierane tylko json z pozycjami wszytskich możliwych pól z servera 
        this.current_data = undefined // to są aktualne pozycje graczy na serwerze (updateowane co 3 sekundy przez klienta)
        this.current_move = undefined // pobierane tylko z servera
        this.move_start_time = undefined // pobierane tylko z servera
        this.move_end_time = undefined // pobierane tylko z servera
        this.dice_rolled = false // czy mozna rzucic kostke czy nie, w zależności czy już bylo nacisniete (pomija warunek, czy jest kolej gracza, bo to jest dynamicznie sprawdzane)
    }

    async getPlaces() {
        const response = await fetch('http://localhost:3000/places', {
            method: 'GET'
        })
        if (!response.ok) {
            return await respose.status
        } else {
            this.places = await response.json()
            return this.places
        }
    }

    checkCookie() {
        if (document.cookie.indexOf('SessionData=') == -1) { //jeśli jeszcze nie ma zadeklarowanego cookie, to indexOf zwróci -1
            return undefined
        } else {
            return JSON.parse(decodeURIComponent(document.cookie.split("=")[1]))
        }
    }

    resetCookie() {
        // nie usunie tych z flagą HttpOnly = true (nie da siez poziomu js)
        document.cookie = ""
        let cookies = document.cookie.split(";");

        for (let cookie of cookies) {
            let eqPos = cookie.indexOf("=");
            let name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
            document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
        }
    }

    pageRefresch() {
        location.reload() // reload zwykły 
        // location.reload(true) // reload zwykły force refresh ale jest deprecated
        // window.location.href = window.location.href // chyba force refresh
        // window.location.replace(window.location.href) // refresh bez dodawania wpisu do historii (możliwe że force refresh, czyli pobiera wszytskie dane a nie czyta z cache)
    }

    async login(nick) {
        const headers = { 'Content-Type': 'application/json;charset=utf-8' } // nagłówek
        const body = JSON.stringify({ nick: nick }) // body - dane
        const response = await fetch('http://localhost:3000/login', {
            method: 'POST',
            headers,
            body
        })
        if (!response.ok) {
            return await respose.status
        } else {
            let response_decoded = await response.json()
            return response_decoded
        }
    }

    async changeStatus(status) {
        const headers = { 'Content-Type': 'application/json;charset=utf-8' } // nagłówek
        const body = JSON.stringify({
            player_id: this.player_id,
            session_id: this.session_id,
            status: status,
        }) // body - dane
        const response = await fetch('http://localhost:3000/changePlayerStatus', {
            method: 'POST',
            headers,
            body
        })
        if (!response.ok) {
            return await respose.status
        } else {
            return
        }
    }

    async getCurrentData() {
        const headers = { 'Content-Type': 'application/json;charset=utf-8' } // nagłówek
        const body = JSON.stringify({
            session_id: this.session_id,
        }) // body - dane

        let response
        try {
            response = await fetch('http://localhost:3000/getCurrentData', {
                method: 'POST',
                headers,
                body
            })
        } catch (error) {
            ifLog.log('Servers isn\'t responding - using latest available data')
        }

        if (response == undefined || !response.ok) {
            return await this.current_data
        } else {
            let response_decoded = await response.json()
            if (response_decoded.error_message == undefined) { // jeśli nie ma error_message
                this.current_data = response_decoded
                if (this.current_data.status == 'ended') {
                    this.game_ended = true
                    if (this.current_data.winner == this.player_color) {
                        alert('Gratulacje 💪 wygrałeś!')
                    } else {
                        alert(`Przegrałeś 😢 \nWygrał gracz z nieckiem: ${this.current_data.players[this.current_data.winner].nick}`)
                    }
                    ifLog.log('R E F R E S H !')
                    this.resetCookie()
                    this.pageRefresch()
                }
                return this.current_data
            } else {
                ifLog.log('R E F R E S H !')
                this.resetCookie()
                this.pageRefresch()
            }
        }
    }

    saveData(data) {
        this.player_id = data.player_id
        this.nick = data.nick
        this.session_id = data.session_id
        this.player_color = data.player_color
        let value = encodeURIComponent(JSON.stringify({
            player_id: this.player_id,
            nick: this.nick,
            session_id: this.session_id,
            player_color: this.player_color
        }))
        document.cookie = `SessionData=${value}; path=/`
        return {
            player_id: this.player_id,
            nick: this.nick,
            session_id: this.session_id,
            player_color: this.player_color
        }
    }

    async rollDice() {
        const headers = { 'Content-Type': 'application/json;charset=utf-8' } // nagłówek
        const body = JSON.stringify({ player_id: this.player_id, session_id: this.session_id }) // body - dane
        const response = await fetch('http://localhost:3000/rollDice', {
            method: 'POST',
            headers,
            body
        })
        if (!response.ok) {
            return await respose.status
        } else {
            let response_decoded = await response.json()
            return response_decoded
        }
    }

    async movePiece(piece) {
        const headers = { 'Content-Type': 'application/json;charset=utf-8' } // nagłówek
        const body = JSON.stringify({ piece: piece, player_id: this.player_id, session_id: this.session_id }) // body - dane
        const response = await fetch('http://localhost:3000/movePiece', {
            method: 'POST',
            headers,
            body
        })
        if (!response.ok) {
            return await response.status
        } else {
            let response_decoded = await response.json()
            return response_decoded
        }
    }

}