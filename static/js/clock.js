export default class Clock {
    constructor(delta_time) {
        this.start_time = Date.now()
        this.delta_time = delta_time
        this.time_stamp = undefined
    }

    checkDelta() { // sprawdza czy upłynął dany odcinek czasu i zwraca true albo false
        if (this.time_stamp == undefined) {
            if (Date.now() - this.start_time >= this.delta_time) {
                this.time_stamp = Date.now()
                return true
            } else {
                return false
            }

        } else {
            if (Date.now() - this.time_stamp >= this.delta_time) {
                this.time_stamp = Date.now()
                return true
            } else {
                return false
            }
        }
    }

    resetClock() {
        this.start_time = Date.now()
        this.time_stamp = undefined
    }
}