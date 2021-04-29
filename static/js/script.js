import ifLog from '/js/consoleLogWrapper.js'
import Session from '/js/session.js'
import Player from '/js/player.js'
import Images from '/js/images.js'
import Playboard from '/js/playboard.js'
import Synth from '/js/synth.js'

window.onload = function () {

    let game_div = document.getElementById('game_div')
    let debug_div = document.getElementById('debug')
    let login_div = document.getElementById('login_div')
    let ok_bt = document.getElementById('submit_name')


    let session = new Session
    let synth = new Synth
    let old_data_from_cookie = session.checkCookie()
    let current_data // to samo co w cookie
    // let server_data // cały obiekt sesji z serwera
    let available_colors = ['red', 'blue', 'green', 'yellow']

    // obiekt z metadanymi danych graczy, podzielona kolorami
    let players = {
        red: undefined,
        blue: undefined,
        green: undefined,
        yellow: undefined,
    }



    // funkcja która okesowo pyta serwer o sesje i na tej podstawie zmienia wszytskie potrzebne pola w obiektach po stronie klienta (to jest strona klienta)
    let intervalFunction = async (server_data, playboard) => {
        if (server_data.status != 'waiting') {
            document.getElementById('ready_label').classList.add('hidden')
            session.dice_rolled = server_data.current_move != session.player_color ? false : session.dice_rolled // jeśli nie jest już nasz ruch, to resetuje dice_rolled na false, zeby później można bylo rzucć kość, a jeśli dale nasz to nie zmienia bo dice_rolled=dice_rolled
            if (session.dice_rolled == false) { // gdy już nie jest nasz ruch
                playboard.stopBlink()
            }

            ifLog.log('session.dice_rolled: ' + session.dice_rolled)
            document.getElementById('roll_dice_bt').disabled = (server_data.current_move == session.player_color && session.dice_rolled == false) ? false : true;
            document.getElementById('dice_area').removeAttribute('class')
            session.current_move = server_data.current_move
            session.move_start_time = server_data.move_start_time
            session.move_end_time = server_data.move_end_time
        }
        for (let color of available_colors) {
            if (players[color].nick != server_data.players[color].nick && server_data.players[color].nick != undefined) {
                players[color].nick = server_data.players[color].nick
                players[color].updateDivText()
            }
            ifLog.log(server_data.players[color].status)
            if (players[color].status != server_data.players[color].status) {
                players[color].status = server_data.players[color].status
                players[color].updateDivStatus()
            }
            if (color == session.current_move) { // to jest do timera
                players[color].startTimer()
            } else {
                players[color].stopTimer()
            }
        }
    }

    let init = async () => {
        await session.getPlaces()
        await Images.loadImages()
        let playboard = new Playboard(document.querySelector('canvas'), session)
        // playboard.startRender()

        document.getElementById('roll_dice_bt').onclick = async (event) => {
            ifLog.log('session.dice_rolled: ' + session.dice_rolled)
            if (session.dice_rolled == false && session.game_ended == false) {
                ifLog.log('losuje kostke')
                session.dice_rolled = true
                event.target.disabled = true
                let drawn_number = (await session.rollDice()).drawn_number
                synth.speak(drawn_number)

                playboard.startBlink(drawn_number)
                ifLog.log(drawn_number)
                ifLog.log(Images.getImage(drawn_number))
                document.getElementById("dice_img").style['background-image'] = `url("/img/${drawn_number}.png")`
            }
        }

        document.addEventListener('current_data_available', async () => {
            ifLog.log('odebrano event')
            playboard.startRender()
            // inicjacyjne uzupełnienie metadanych graczy do obiektu, czyli wpisanie tam tylko siebie a reszta to placeholdery
            for (let color of available_colors) {
                let player = new Player(color, `?`, '', session)
                ifLog.log(current_data)
                if (color == current_data.player_color) {
                    player.color = color
                    player.nick = current_data.nick
                    player.id = current_data.id
                }
                player.updateDivText()
                players[color] = player
            }

            // uzupełniene metadanych graczy do obiektu, o dane z serwera (nadpisanie placeholderów i ustawienie inputa w dobrej pozycji)
            let server_data = await session.getCurrentData()
            if (server_data.status == "waiting") {
                document.getElementById('ready_input').checked = server_data.players[session.player_color].status
                document.getElementById('ready_label').lastChild.data = (server_data.players[session.player_color].status == true) ? 'Chcę już grać!' : 'Czekam na innych graczy.'
                document.getElementById('ready_label').classList.remove('hidden')
            }

            await intervalFunction(server_data, playboard)

            let ajax_loop_ID = setInterval(async () => {
                if (session.game_ended == false) {
                    let server_data = await session.getCurrentData()
                    ifLog.log(server_data)
                    await intervalFunction(server_data, playboard)
                } else {
                    clearInterval(ajax_loop_ID)
                }
            }, 3000)
        })

        document.getElementById('ready_input').addEventListener('input', async (event) => {
            // ifLog.log('zmiana stanu mojego')
            // ifLog.log(event.target.checked)
            players[session.player_color].status = event.target.checked
            document.getElementById('ready_label').lastChild.data = (players[session.player_color].status == true) ? 'Chcę już grać!' : 'Czekam na innych graczy.'
            await session.changeStatus(players[session.player_color].status)
            players[session.player_color].updateDivStatus()

        })

        // sprawdzanie, czy w ciasteczkach jest jeszce zapisana stara sesja
        if (old_data_from_cookie == undefined) { // jeśli nie to pozwala się zalogować i odbiera metadane od servera
            ifLog.log('niemacooki')
            ok_bt.addEventListener('click', async () => {
                let nick = document.getElementById('nick').value

                let res = await session.login(nick)
                current_data = session.saveData(res)

                debug_div.innerText += `player_id: ${session.player_id} \nsession_id:${session.session_id} \nsession.nick: ${session.nick} \nplayer_color:${session.player_color}`

                login_div.classList.add('hidden')
                document.getElementById('ready_label').classList.remove('hidden')
                game_div.classList.remove('hidden')
                await session.getCurrentData()
                document.dispatchEvent(new CustomEvent("current_data_available"))
            })
            login_div.classList.remove('hidden')
        } else { // jeśli tak to od razu renderuje strone ze starymi danymi
            current_data = session.saveData(old_data_from_cookie)
            debug_div.innerText += `player_id: ${session.player_id} \nsession_id:${session.session_id} \nsession.nick: ${session.nick} \nplayer_color:${session.player_color}`
            game_div.classList.remove('hidden')
            await session.getCurrentData()
            document.dispatchEvent(new CustomEvent("current_data_available"))
            ifLog.log('odpalono z cokie')
        }

        ifLog.log(current_data)
    }

    init()
}