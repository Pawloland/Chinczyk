const express = require('express')
const colors = require('colors')
const Datastore = require('nedb')
const path = require("path")
const { json } = require('express')
const places = require('./db/places.json')

var app = express()
var PORT = process.env.PORT || 3000

app.use(express.static('static'))
app.use(express.json()); //Used to parse JSON bodies
// app.use(express.urlencoded()); //Parse URL-encoded bodies


let users_db = new Datastore({ // kolekcja 
    filename: 'db/users.db',
    autoload: true
})

let sessions_db = new Datastore({ // kolekcja 
    filename: 'db/sessions.db',
    autoload: true
})

// po restarcie serwera wznawia zaległe mainloop-y
try {
    sessions_db.find({}, function (err, docs) {
        for (let session of docs) {
            if (session.status == 'playing') {
                console.log(session._id)
                console.log(session.current_move)
                console.log(available_colors.indexOf(session.current_move))
                let color_index = available_colors.indexOf(session.current_move)
                let mainloop = new Mainloop(session._id, color_index)
            }
        }
    })
} catch (error) { }

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

let available_colors = ['red', 'blue', 'green', 'yellow']
let available_pieces = ['first', 'second', 'third', 'fourth']

function getColorByPlayerID(id, players_obj) {
    for (let [key, value] of Object.entries(players_obj)) {
        if (value.id == id) {
            return key
        }
    }
}

function checkNubmerOfPlayersInSession(players_obj) {
    let nr = 0
    for (let color of available_colors) {
        if (players_obj[color].id != undefined) {
            nr++
        }
    }
    return nr
}

function checkNubmerOfReadyPlayersInSession(players_obj) {
    let nr = 0
    for (let color of available_colors) {
        if (players_obj[color].status == true) {
            nr++
        }
    }
    return nr
}

function setAllActivePlayersStatusToReady(players_obj) {
    for (let color of available_colors) {
        if (players_obj[color].id != undefined) {
            players_obj[color].status = true
        }
    }
    return players_obj
}

function comparePositions(base_color, base_piece, base_drawn_nr, target_color, target_piece, players_obj) {
    //porównuje różne relatywne pozycje (indexy) między różnymi kolorami na postawie ich koordynatów
    let base_cords = {
        place: `place_${(players_obj[base_color].pieces[base_piece] + base_drawn_nr)}`,
        top: places[`place_${(players_obj[base_color].pieces[base_piece] + base_drawn_nr)}`][base_color].top,
        left: places[`place_${(players_obj[base_color].pieces[base_piece] + base_drawn_nr)}`][base_color].left,
    }
    let target_cords = {
        place: `place_${players_obj[target_color].pieces[target_piece]}`,
        top: places[`place_${players_obj[target_color].pieces[target_piece]}`][target_color].top == undefined ? places[`place_0`][target_color][target_piece].top : places[`place_${players_obj[target_color].pieces[target_piece]}`][target_color].top,
        left: places[`place_${players_obj[target_color].pieces[target_piece]}`][target_color].left == undefined ? places[`place_0`][target_color][target_piece].left : places[`place_${players_obj[target_color].pieces[target_piece]}`][target_color].left,
    }
    // console.log('++++++++++++++++++++++++++++++++++')
    // console.log(places[`place_${players_obj[target_color].pieces[target_piece]}`][target_color].top)
    // console.log(places[`place_${players_obj[target_color].pieces[target_piece]}`][target_color])
    // console.log(places[`place_${players_obj[target_color].pieces[target_piece]}`])
    // console.log(`place_${players_obj[target_color].pieces[target_piece]}`)
    // console.log(players_obj[target_color].pieces)
    // console.log(players_obj[target_color])
    // console.log(players_obj)
    // console.log(places)
    // console.log(`base_cords ${base_color} ${base_piece} place_${players_obj[base_color].pieces[base_piece]} ${base_drawn_nr} place_${(players_obj[base_color].pieces[base_piece] + base_drawn_nr)}`)
    // console.log(base_cords)
    // console.log(`target_cords  ${target_color} ${target_piece}`)
    // console.log(target_cords)

    // console.log('czy da się kogoś wywalić -> ' + (base_cords.top == target_cords.top && base_cords.left == target_cords.left))
    // console.log('++++++++++++++++++++++++++++++++++')
    return (base_cords.top == target_cords.top && base_cords.left == target_cords.left)
}

function kickAllDifferentPlayersToBase(kicker_color, kicker_piece, players_obj) {
    let new_players_obj = { ...players_obj }
    let kicker_drawn_nr = players_obj[kicker_color].drawn_number // powinien być zawsze inny niż null (chyba że nie znalazłem jakiegoś edge case'a)
    for (let color of available_colors) {
        if (color == kicker_color) {
            continue
        }
        for (let piece of available_pieces) {
            // comparePositions(kicker_color, kicker_piece, color, piece, players_obj)
            // console.log('kicker_color: ' + kicker_color + ' kicker_piece: ' + kicker_piece)
            // console.log('target_color: ' + color + ' target_piece: ' + piece)
            if (comparePositions(kicker_color, kicker_piece, kicker_drawn_nr, color, piece, players_obj) == true) {
                new_players_obj[color].pieces[piece] = 0
            }
        }
    }
    return new_players_obj
}

function checkIfAllPiecesAreInBase(piece_color, players_obj) {
    for (let piece_name of available_pieces) {
        if (players_obj[piece_color].pieces[piece_name] != 0) {
            return false // jeśli jakiś nie jest w bazie na pozycji 0 to zwraca false
        }
    }
    return true // tylko jesli wszytskie są na pozycjach 0 to zwraca true
}

function checkIfAnyPieceCanBeMoved(piece_color, players_obj) {
    let can_be_moved = false
    let drawn_nr = players_obj[piece_color].drawn_number

    for (let piece_name of available_pieces) {
        let index_position = players_obj[piece_color].pieces[piece_name]

        if (index_position == 0 && (drawn_nr == 1 || drawn_nr == 6)) {
            console.log('mozna wyjsc z domku')
            can_be_moved = true
        } else if (index_position != 0 && index_position + drawn_nr <= 40) {
            console.log('mozna poruszac sie po planszy i wyladuje na maxymalnie 40 polu')
            can_be_moved = true
        } else if (41 <= index_position + drawn_nr && index_position + drawn_nr <= 44) {
            console.log('wpadnie do domku')
            if (available_pieces.some(piece => players_obj[piece_color].pieces[piece] == index_position + drawn_nr)) { // jeśli jakiś pionek jest już na tym miejscu
                console.log('pole w domku zajete')
                can_be_moved = false // to nie można sie tam ruszyć
            } else { // jeśli żadnego na tym miejscu nie ma to
                console.log('pole w domku puste')
                can_be_moved = true // można się tam ruszyć
            }
        }
        if (can_be_moved == true) {
            break
        }
    }
    return can_be_moved
}

function allPlayersAreReady(session_id) {
    let mainloop = new Mainloop(session_id)
}


// to jest główna funkcja, która odpowiada za czasy rozgrywki
class Mainloop {
    constructor(session_id, color_index = 0) { // color index to defaultowo 0, ale jak revive'ujemy sesje po restarce servera to trzeba ręcznie podać
        this.session_id = session_id
        this.intervalID // ustawiany w startGame()
        this.skipIntervalID // ustawiany w startGame()
        this.move_start_time // ustawiany w startGame()
        this.move_end_time // ustawiany w startGame()
        //this.current_player = 'red' // defaultowo zawsze jest czerwony, więc można tak tu ustawić
        this.move_duration = 60 * 1000 // w ms
        this.skip_check_duration = 0.5 * 1000 // w ms
        this.color_index = color_index // defaultowo 0
        this.startGame()
    }

    async getSesionAsObject() {
        return new Promise((resolve, reject) => {
            // console.log(this.session_id)
            sessions_db.find({ _id: this.session_id }, function (err, docs) {
                // console.log(docs[0])
                resolve(docs[0])
            })
        })
    }

    async updateSessionInDB(updated_session) {
        return new Promise((resolve, reject) => {
            sessions_db.update({ _id: this.session_id }, { $set: updated_session }, {}, function (err, numOfUpdatedDocs) {
                sessions_db.persistence.compactDatafile()
                resolve(true)
            })
        })

    }

    async nextColor(acction) { //get, set
        let players_obj = (await this.getSesionAsObject()).players
        if (acction == 'get') { // tylko zwraca kolejny kolor, ale nic nie zmienia w danych - używam do logowania
            let temp_index = this.color_index
            if (temp_index == 3 || players_obj[available_colors[temp_index + 1]].id == undefined) {
                temp_index = 0
            } else {
                temp_index++
            }
            return available_colors[temp_index]
        } else if (acction == 'set') { // to zwraca kolejny kolor i zmienia color_index
            if (this.color_index == 3 || players_obj[available_colors[this.color_index + 1]].id == undefined) {
                this.color_index = 0
            } else {
                this.color_index++
            }
            return available_colors[this.color_index]
        }
    }


    async startGame() {
        this.move_start_time = Date.now() // pocz w ms
        this.move_end_time = this.move_start_time + this.move_duration // koniec w ms


        let intervalFunction = async (init) => {
            this.move_start_time = Date.now() // pocz w ms
            this.move_end_time = this.move_start_time + this.move_duration // koniec w ms
            let updated_session = await this.getSesionAsObject()
            if (init == false) {
                console.log(`Zmiana gracza z ${updated_session.current_move} na ${await this.nextColor('get')}`)
                updated_session.current_move = await this.nextColor('set')
                for (let color of available_colors) {
                    if (color == updated_session.current_move) {
                        updated_session.players[color].can_draw = true
                    } else {
                        updated_session.players[color].can_draw = false
                    }
                }
            } else {
                console.log(`Początek z graczem ${updated_session.current_move}, następny będzie ${await this.nextColor('get')}`)
            }
            updated_session.move_start_time = this.move_start_time
            updated_session.move_end_time = this.move_end_time
            await this.updateSessionInDB(updated_session)
            console.log(`start: ${updated_session.move_start_time}\n stop: ${updated_session.move_end_time}`)
        }

        await intervalFunction(true)

        let checkSkip = async () => {
            let updated_session = await this.getSesionAsObject()
            if (updated_session.reset_mainloop == true) {
                console.log('Detected break - skiping to next player')
                this.stopGame()
                updated_session.reset_mainloop = false
                this.updateSessionInDB(updated_session)

                await intervalFunction(false)
                this.intervalID = setInterval(async () => {
                    await intervalFunction(false)
                }, this.move_duration) // 60 sekund = 60 000 ms
            }
            if (updated_session.status == 'ended') {
                this.endWholeMainloop()
            }
        }

        this.intervalID = setInterval(async () => {
            await intervalFunction(false)
        }, this.move_duration) // 60 sekund = 60 000 ms

        this.skipIntervalID = setInterval(async () => {
            console.log('check skip for session_id: ' + this.session_id)
            await checkSkip()
        }, this.skip_check_duration)
    }

    stopGame() {
        clearInterval(this.intervalID)
    }

    endWholeMainloop() {
        this.stopGame()
        clearInterval(this.skipIntervalID)
    }
}


app.get('/places', function (req, res) {
    res.json(places)
})

app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname + "/static/html/index.html"))
})

app.post('/movePiece', function (req, res) {
    console.log('/movePiece')
    console.log(req.body)
    let piece = req.body.piece // first, second, third, fourth
    let session_id = req.body.session_id
    let player_id = req.body.player_id

    sessions_db.find({ _id: session_id }, function (err, docs) {


        let found_session = docs[docs.length - 1]
        let updatetd_data = JSON.parse(JSON.stringify(found_session))
        let player_color = getColorByPlayerID(player_id, updatetd_data.players)

        let found_applicable_case = false
        if (found_session.players[player_color].was_moved == true) { // jeśli był już ruszony w tuże to nie można już ruszyć drugi raz
            res.json({ message: `can't move any piece anymore because you have already done so in this round` })
        } else {
            updatetd_data.players[player_color].was_moved = true
            if (updatetd_data.players[player_color].pieces[piece] == 0 && (found_session.players[player_color].drawn_number == 1 || found_session.players[player_color].drawn_number == 6)) { // na miejscu 0 i wylosowal 1 albo 6 -> wchodzi na 1
                found_applicable_case = true
                console.log('wyjscie z domku')
                updatetd_players = kickAllDifferentPlayersToBase(player_color, piece, updatetd_data.players)
                updatetd_data.players = updatetd_players
                updatetd_data.players[player_color].pieces[piece] = 1
            } else if (updatetd_data.players[player_color].pieces[piece] != 0 && updatetd_data.players[player_color].pieces[piece] + found_session.players[player_color].drawn_number <= 40) { // na miejscu innym niz 0 i nie wejdzie do domku
                //Tu logika odpowiedzialna za zbijanie pionków "wrogów" z miejsca i wtedy ustawiamy tam nasz pionek (mogą być 2 pionki tego sammego koloru)
                found_applicable_case = true
                console.log('normalne przejscie na planszy')
                updatetd_players = kickAllDifferentPlayersToBase(player_color, piece, updatetd_data.players)
                updatetd_data.players = updatetd_players
                updatetd_data.players[player_color].pieces[piece] = updatetd_data.players[player_color].pieces[piece] + found_session.players[player_color].drawn_number
            } else if (updatetd_data.players[player_color].pieces[piece] != 0 && 41 <= updatetd_data.players[player_color].pieces[piece] + found_session.players[player_color].drawn_number && updatetd_data.players[player_color].pieces[piece] + found_session.players[player_color].drawn_number <= 44) { // na miejscu innym niz 0 i wejdzie do domku
                //Tu logika odpowiedzialna za sprawdzenie czy dane miejsce jest puste i jeśli tak to tam się ustawia nasz pionek (w domku)
                console.log('wejscie do domku')
                let can_move = true
                for (let possible_piece of available_pieces) {
                    if (updatetd_data.players[player_color].pieces[possible_piece] == updatetd_data.players[player_color].pieces[piece] + found_session.players[player_color].drawn_number) { //jeśli jakikolwiek z pionków danego koloru jest na potencjalnie następnym miejscu w domku
                        can_move = false
                        break
                    }
                }
                if (can_move == true) {
                    updatetd_data.players[player_color].pieces[piece] = updatetd_data.players[player_color].pieces[piece] + found_session.players[player_color].drawn_number
                    found_applicable_case = true
                }

                //Jeśli cały domek zostanie zajęty to status sesji zmieniony na 'ended' i ustawiony wygrany na dany kolor
                if (available_pieces.every(possible_piece => 41 <= updatetd_data.players[player_color].pieces[possible_piece] && updatetd_data.players[player_color].pieces[possible_piece] <= 44) == true) {
                    updatetd_data.status = 'ended'
                    updatetd_data.winner = player_color
                }
            }
            // updatetd_data.players[player_color].pieces[piece] += found_session.players[player_color].drawn_number
            // updatetd_data.players[player_color].drawn_number = null
            if (found_session.status == 'playing') {
                if (found_applicable_case == true) { // user wysłał jakimś cudem niemożliwy pionek, który wyszedłby poza planszę, albo nie wiem co sie stalo (nie chcialo mi sie wymyslać edge-caseów)
                    res.json({ message: 'You sent impossible to move piece. Your turn in this round was taken, but none of the pieces was moved. F-u cheater.' })
                    updatetd_data.reset_mainloop = true // dzieki temu przeskakuje kolejka do nastepnego gracza
                    sessions_db.update({ _id: found_session._id }, { $set: updatetd_data }, {}, function (err, numOfUpdatedDocs) {
                    })
                } else {
                    sessions_db.update({ _id: found_session._id }, { $set: updatetd_data }, {}, function (err, numOfUpdatedDocs) {
                        res.json({ message: 'ok' })
                        sessions_db.persistence.compactDatafile()
                        updatetd_data.reset_mainloop = true // dzieki temu przeskakuje kolejka do nastepnego gracza
                        sessions_db.update({ _id: found_session._id }, { $set: updatetd_data }, {}, function (err, numOfUpdatedDocs) {
                        })
                    })
                }
            } else {
                res.json({ message: 'error - session is set to ' + found_session.status })
            }
        }
    })

})

app.post('/rollDice', function (req, res) {
    console.log('/rollDice')
    console.log(req.body)
    let player_id = req.body.player_id
    let session_id = req.body.session_id
    sessions_db.find({ _id: session_id }, function (err, docs) {
        let found_session = docs[docs.length - 1]
        let updatetd_data = JSON.parse(JSON.stringify(found_session))
        let player_color = getColorByPlayerID(player_id, updatetd_data.players)
        if (updatetd_data.players[player_color].can_draw == true) {
            updatetd_data.players[player_color].can_draw = false
            updatetd_data.players[player_color].was_moved = false
            updatetd_data.players[player_color].drawn_number = randomInt(1, 6)
        }

        if (found_session.status == 'playing') {

            sessions_db.update({ _id: found_session._id }, { $set: updatetd_data }, {}, function (err, numOfUpdatedDocs) {
                res.json({
                    drawn_number: updatetd_data.players[player_color].drawn_number
                })
                sessions_db.persistence.compactDatafile()
                console.log('checkIfAllPiecesAreInBase(player_color, updatetd_data.players)')
                console.log(checkIfAllPiecesAreInBase(player_color, updatetd_data.players))
                console.log('1 < updatetd_data.players[player_color].drawn_number < 6')
                console.log(1 < updatetd_data.players[player_color].drawn_number < 6)
                console.log(updatetd_data.players[player_color].drawn_number)
                console.log((checkIfAllPiecesAreInBase(player_color, updatetd_data.players) == true && (1 < updatetd_data.players[player_color].drawn_number && updatetd_data.players[player_color].drawn_number < 6)))
                console.log(checkIfAnyPieceCanBeMoved(player_color, updatetd_data.players) + 'ssd')
                console.log(checkIfAnyPieceCanBeMoved(player_color, updatetd_data.players) == false)
                if ((checkIfAllPiecesAreInBase(player_color, updatetd_data.players) == true && (1 < updatetd_data.players[player_color].drawn_number && updatetd_data.players[player_color].drawn_number < 6)) || checkIfAnyPieceCanBeMoved(player_color, updatetd_data.players) == false) {
                    updatetd_data.reset_mainloop = true
                    sessions_db.update({ _id: found_session._id }, { $set: updatetd_data }, {}, function (err, numOfUpdatedDocs) { })
                }
                // for (let possible_piece of available_pieces) {
                //     if (possible_piece == )
                // }
                // if (available_pieces.every(possible_piece => 41 <= updatetd_data.players[player_color].pieces[possible_piece] && updatetd_data.players[player_color].pieces[possible_piece] <= 44) == true) {
                //     updatetd_data.reset_mainloop = true
                //     sessions_db.update({ _id: found_session._id }, { $set: updatetd_data }, {}, function (err, numOfUpdatedDocs) { })
                // }
            })
        } else {
            res.json({ message: 'error - session is set to ' + found_session.status })
        }

    })
})

app.post('/getCurrentData', function (req, res) {
    // console.log(req.body)
    let player_id = req.body.player_id
    let nick = req.body.nick
    let session_id = req.body.session_id
    sessions_db.find({ _id: session_id }, function (err, docs) {
        if (docs.length == 0) { // nie znaleziono sesji
            res.json({ error_message: 'session not found' })
        } else {
            let found_session = docs[docs.length - 1]
            res.json(found_session)
        }
    })
})

app.post('/login', async function (req, res) {
    console.log(req.body)
    let id = ''
    let nick = req.body.nick
    let session_id
    let new_player = {
        // _id: automatycznie ustawiane
        nick: nick
    }
    users_db.insert(new_player, function (err, newDoc) { //dodawanie wykonuje się chyba asynchronicznie patrząc po milisekundach
        id = newDoc._id
        sessions_db.find({ status: 'waiting' }, function (err, docs) {
            if (docs.length == 0) {
                console.log('pusto')
                let new_session = {
                    // _id: automatyczny
                    status: 'waiting', // waiting, playing, ended
                    winner: null, // ustawaine na blue, red, green, yellow po wygranej
                    reset_mainloop: false, // żeby przeskoczyć do następnego gracza
                    current_move: undefined, //red, blue, green, yellow
                    move_start_time: undefined, // pocz ruchu w ms
                    move_end_time: undefined, // koniec ruchu w ms
                    players: {
                        red: {
                            nick: newDoc.nick,
                            id: newDoc._id,
                            can_draw: true,
                            was_moved: false,
                            drawn_number: null,
                            status: false, // false - czeka, true-gotowy
                            pieces: {
                                first: 0,
                                second: 0,
                                third: 0,
                                fourth: 0,
                            }
                        },
                        blue: {
                            nick: undefined,
                            id: undefined,
                            can_draw: false,
                            was_moved: false,
                            drawn_number: null,
                            status: false, // false - czeka, true-gotowy
                            pieces: {
                                first: 0,
                                second: 0,
                                third: 0,
                                fourth: 0,
                            }
                        },
                        green: {
                            nick: undefined,
                            id: undefined,
                            can_draw: false,
                            was_moved: false,
                            drawn_number: null,
                            status: false, // false - czeka, true-gotowy
                            pieces: {
                                first: 0,
                                second: 0,
                                third: 0,
                                fourth: 0,
                            }
                        },
                        yellow: {
                            nick: undefined,
                            id: undefined,
                            can_draw: false,
                            was_moved: false,
                            drawn_number: null,
                            status: false, // false - czeka, true-gotowy
                            pieces: {
                                first: 0,
                                second: 0,
                                third: 0,
                                fourth: 0,
                            }
                        },
                    }

                }
                sessions_db.insert(new_session, function (err, newDocSesion) {
                    session_id = newDocSesion._id
                    res.json({
                        player_id: newDoc._id,
                        nick: nick,
                        session_id: session_id,
                        player_color: 'red'
                    })
                })
            } else {
                let found_session = docs[docs.length - 1]
                for (let color of available_colors) {
                    if (found_session.players[color].nick == undefined) {
                        found_session.players[color].id = newDoc._id
                        found_session.players[color].nick = newDoc.nick
                        found_session.players[color].pieces = {
                            first: 0,
                            second: 0,
                            third: 0,
                            fourth: 0,
                        }
                        if (color == 'yellow') {
                            // jeśli wbił ostatni gracz do pokoju, to automatycznie zmienia się stan gry na playing,
                            // a wszyscy gracze mają zmieniony przez serwer status na true, czyli gotowi do gry
                            found_session.players = setAllActivePlayersStatusToReady(found_session.players)
                            found_session.status = 'playing'
                            found_session.current_move = available_colors[0] // defaultowo ustawia, że zaczyna czerwony gracz
                        }
                        sessions_db.update({ _id: found_session._id }, { $set: found_session }, {}, function (err, numOfUpdatedDocs) {
                            if (color == 'yellow') {
                                allPlayersAreReady(found_session._id)
                            }
                            res.json({
                                player_id: newDoc._id,
                                nick: nick,
                                session_id: found_session._id,
                                player_color: color
                            })
                            sessions_db.persistence.compactDatafile()
                        })
                        break
                    }
                }
            }

        })
    })

})

app.post('/changePlayerStatus', function (req, res) {
    console.log(req.body)
    let player_id = req.body.player_id
    let session_id = req.body.session_id
    let status = req.body.status

    sessions_db.find({ _id: session_id }, function (err, docs) {
        let found_session = docs[docs.length - 1]
        let updatetd_data = JSON.parse(JSON.stringify(found_session))
        let player_color = getColorByPlayerID(player_id, updatetd_data.players)
        if (found_session.status == "waiting") {
            updatetd_data.players[player_color].status = status
            // tu sprawdza czy wszyscy gracze są gotowi (minimum dwóch w lobby i wszyscy 
            // z tych co są w nim są, to muszą być gotowi, żeby zmienić stan lobby na playing)
            if (checkNubmerOfPlayersInSession(updatetd_data.players) == checkNubmerOfReadyPlayersInSession(updatetd_data.players) && checkNubmerOfPlayersInSession(updatetd_data.players) >= 2) {
                updatetd_data.status = 'playing'
                updatetd_data.current_move = available_colors[0] // defaultowo ustawia, że zaczyna czerwony gracz
            }

            sessions_db.update({ _id: found_session._id }, { $set: updatetd_data }, {}, function (err, numOfUpdatedDocs) {
                if (checkNubmerOfPlayersInSession(updatetd_data.players) == checkNubmerOfReadyPlayersInSession(updatetd_data.players) && checkNubmerOfPlayersInSession(updatetd_data.players) >= 2) {
                    allPlayersAreReady(found_session._id)
                }
                res.end()
                sessions_db.persistence.compactDatafile()
            })
        } else {
            res.end()
        }
    })

})


app.listen(PORT, function () {
    console.log("start serwera na porcie " + PORT)
    console.log(`http://localhost:${PORT}`.cyan)
    console.log("ścieżka do katalogu głównego aplikacji: " + __dirname)
})