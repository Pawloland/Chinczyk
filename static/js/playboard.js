import ifLog from '/js/consoleLogWrapper.js'
import Images from '/js/images.js'
import Clock from '/js/clock.js'

export default class Playboard {
    constructor(canvas, session) {
        this.canvas = canvas
        this.context = this.canvas.getContext("2d")
        this.canvas_width = this.canvas.width;
        this.canvas_height = this.canvas.height;

        // Session
        this.session = session
        // poniżej są przekopiowane wartości obiektu klasy Session, żeby można było szybko podpatrzyć co jest co
        // this.player_id = undefined
        // this.nick = undefined
        // this.session_id = undefined
        // this.player_color = undefined
        // this.places = undefined // pobierane tylko z servera 
        // this.current_data = undefined // to są aktualne pozycje graczy na serwerze (updateowane co 3 sekundy przez klienta)
        // this.current_move = undefined // pobierane tylko z servera
        // this.move_start_time = undefined // pobierane tylko z servera
        // this.move_end_time = undefined // pobierane tylko z servera
        // this.dice_rolled = false // czy mozna rzucic kostke czy nie, w zależności czy już bylo nacisniete (pomija warunek, czy jest kolej gracza, bo to jest dynamicznie sprawdzane)
        this.render = true
        this.blink = false
        this.blink_state = false // true -> kolor| false -> białe
        this.available_colors = ['red', 'blue', 'green', 'yellow']
        this.available_pieces = ['first', 'second', 'third', 'fourth']
        this.hovered_shape = undefined // jak jest się nad jakimkolwiek pionkeim to się zmieni i są to dane danego pionka
        this.drawn_nr = undefined // to jest pobierane na startBlink() jako parametr 

        this.clock = new Clock(600)
    }

    getTranslatedPosition(piece_nr, piece_color, piece_name) {
        // ifLog.log('getTranslatedPosition(piece_nr, piece_color, piece_name)')
        // ifLog.log(piece_nr, piece_color, piece_name)
        if (piece_nr == 0) {
            return this.session.places[`place_${piece_nr}`][piece_color][piece_name]
        } else {
            return this.session.places[`place_${piece_nr}`][piece_color]
        }
    }

    checkIfCanMoveForward(piece_nr, piece_color) {
        if (piece_nr == 0 && (this.drawn_nr == 1 || this.drawn_nr == 6)) {
            return true
        } else if (piece_nr != 0 && piece_nr + this.drawn_nr <= 40) { // jeśli porejction jest na "publicznej trasie" to można zawsze sie ruszyć
            return true
        } else if (piece_nr != 0 && (41 <= piece_nr + this.drawn_nr && piece_nr + this.drawn_nr <= 44)) { // jeśli wchodzi do domku to trzeba sprawdzic czy dane miejsce w domku jest puste
            if (this.available_pieces.some(piece => this.session.current_data.players[piece_color].pieces[piece] == piece_nr + this.drawn_nr)) { // jeśli jakiś pionek jest już na tym miejscu
                return false // to nie można sie tam ruszyć
            } else { // jeśli żadnego na tym miejscu nie ma to
                return true // można się tam ruszyć
            }
        } else { // jeśli wyjdzie poza mape
            return false
        }
    }

    defineCirclePath(piece_color, piece_name, piece_nr, check) { // check : true -> wywołane na hoverze |  false -> wywołane normalnie z reqanimframe | 'projection' -> podpowiedz gdzie wyladuje po wcisnieciu
        // ifLog.log(Images.getImage(`${piece_color}_piece`))
        this.context.beginPath();
        let translated_position = this.getTranslatedPosition(piece_nr, piece_color, piece_name)
        if (check == false) {
            if (piece_color == this.session.player_color && this.checkIfCanMoveForward(piece_nr, piece_color) && this.blink == true) { // jeśli dany pionek mozna ruszyc to mruga
                if (this.clock.checkDelta() == true) {
                    this.blink_state = !this.blink_state
                }
                if (this.blink_state == true) {
                    this.context.drawImage(Images.getImage(`${piece_color}_piece`), translated_position.left, translated_position.top, this.session.places.piece_dimmensions, this.session.places.piece_dimmensions) //image ,top_left_x, top_left_y, width, height
                } else {
                    this.context.drawImage(Images.getImage('white_piece'), translated_position.left, translated_position.top, this.session.places.piece_dimmensions, this.session.places.piece_dimmensions) //image ,top_left_x, top_left_y, width, height
                }
            } else {// jesli nie mozna ruszyc to swieci na stale
                this.context.drawImage(Images.getImage(`${piece_color}_piece`), translated_position.left, translated_position.top, this.session.places.piece_dimmensions, this.session.places.piece_dimmensions) //image ,top_left_x, top_left_y, width, height
            }
        } else if (check == true) {
            let circle = new Path2D();
            // circle.moveTo(100, 100);
            circle.arc(translated_position.left + this.session.places.piece_dimmensions / 2, translated_position.top + this.session.places.piece_dimmensions / 2, this.session.places.piece_dimmensions / 2, 0, 2 * Math.PI) // x,y,r,sAngle,eAngle,counterclockwise
            // this.context.stroke(circle)
            this.context.closePath();
            return circle
        } else if (check == 'projection') {
            this.context.drawImage(Images.getImage(`projection_piece`), translated_position.left, translated_position.top, this.session.places.piece_dimmensions, this.session.places.piece_dimmensions) //image ,top_left_x, top_left_y, width, height
        }
    }

    async handleMouseClick() {
        if (this.hovered_shape != undefined) {
            this.stopBlink()
            await this.session.movePiece(this.hovered_shape.name)
            this.hovered_shape = undefined
            this.dice_rolled = false
            await this.session.getCurrentData()
        }
    }

    handleMouseMove(event) {
        // tell the browser we're handling this event
        event.preventDefault()
        event.stopPropagation()
        if (this.blink == true) {
            let mouse_x = event.pageX - event.currentTarget.offsetLeft
            let mouse_y = event.pageY - document.getElementById('playboard').offsetTop
            let canvas_x = mouse_x / this.canvas.offsetWidth * 1200
            let canvas_y = mouse_y / this.canvas.offsetHeight * 1200
            // ifLog.log(`Left: ${mouse_x}  Top: ${mouse_y}   w px html`) //  (nie px w canvas- trzeba to jeszcze przeskalować jakoś)
            // ifLog.log(`Left: ${canvas_x}  Top: ${canvas_y}   w px canvas`)
            // this.context.fillStyle = "magenta";
            // this.context.fillRect(canvas_x, canvas_y, 10, 10); // fill in the pixel at (10,10)
            // Put your mousemove stuff here

            let available_colors_reversed = JSON.parse(JSON.stringify(this.available_colors)).reverse()
            let available_pieces_reversed = JSON.parse(JSON.stringify(this.available_pieces)).reverse()
            this.hovered_shape = undefined
            // ctx.clearRect(0, 0, cw, ch);


            // for (let piece_color of [this.session.player_color]) {
            let piece_color = this.session.player_color
            for (let piece_name of available_pieces_reversed) {
                if (this.checkIfCanMoveForward(this.session.current_data.players[piece_color].pieces[piece_name], piece_color) == true) {
                    let circle = this.defineCirclePath(piece_color, piece_name, this.session.current_data.players[piece_color].pieces[piece_name], true)
                    if (this.context.isPointInPath(circle, canvas_x, canvas_y)) { // sprawdza czy myszka jest na poprzednio narysowanej sciezce
                        this.hovered_shape = {
                            color: piece_color,
                            name: piece_name,
                            nr: this.session.current_data.players[piece_color].pieces[piece_name],
                            top: this.getTranslatedPosition(this.session.current_data.players[piece_color].pieces[piece_name], piece_color, piece_name).top,
                            left: this.getTranslatedPosition(this.session.current_data.players[piece_color].pieces[piece_name], piece_color, piece_name).left,
                        }
                        break
                    }
                }
            }
            // }
        }
        if (this.hovered_shape == undefined) { //jeśli jest poza jakimkolwiek kształtem
            this.canvas.style.cursor = 'default'
        } else { // jeśli jest na jakimś kształcie
            this.canvas.style.cursor = 'pointer'
            ifLog.log(this.hovered_shape)
        }

    }

    animate() {
        if (this.render == true) {
            requestAnimationFrame(() => { this.animate() })
            // ifLog.log('rysowanie')
            // tu cała logika chyba odpowiedzialna za renderowanie

            this.context.clearRect(0, 0, 1200, 1200); //czyści obszar czarny
            this.context.fillStyle = "#000000"; // kolor tła czyszczony
            this.context.drawImage(Images.getImage('plansza_edited'), 0, 0, 1200, 1200) //image ,top_left_x, top_left_y, width, height

            for (let piece_color of this.available_colors) {
                for (let piece_name of this.available_pieces) {
                    this.defineCirclePath(piece_color, piece_name, this.session.current_data.players[piece_color].pieces[piece_name], false)
                }
            }
            if (this.hovered_shape != undefined) {
                if (this.hovered_shape.nr == 0 && (this.drawn_nr == 1 || this.drawn_nr == 6)) {
                    this.defineCirclePath(this.hovered_shape.color, this.hovered_shape.name, 1, 'projection')
                } else if (this.hovered_shape.nr + this.drawn_nr <= 44) { // pionek jest w gdzies w przedziale <1; 43> i po dodaniu liczby z kostki nie wychodzi poza planszę
                    this.defineCirclePath(this.hovered_shape.color, this.hovered_shape.name, this.hovered_shape.nr + this.drawn_nr, 'projection')
                }
            }
        }
    }

    startRender() {
        this.render = true
        this.animate()
        this.canvas.onmousemove = (event) => { this.handleMouseMove(event) }
        this.canvas.onclick = async () => {
            // if (this.hovered_shape != undefined) {
            // ifLog.log(alert(JSON.stringify(this.hovered_shape, null, 5)))
            // }
            await this.handleMouseClick()
        }
    }

    stopRender() {
        this.render = false
    }

    startBlink(drawn_nr) {
        this.drawn_nr = drawn_nr
        this.blink = true
        this.blink_state = false
        this.clock.resetClock()
    }

    stopBlink() {
        this.blink = false
    }
}