// generowanie jsona z miejscami
let ob = {}
for (let i = 0; i <= 44; i++) {
    if (i == 0) {
        ob[`place_${i
            }`
        ] = {
            red: {
                first: {
                    top: 0,
                    left: 0,
                },
                second: {
                    top: 0,
                    left: 0,
                },
                third: {
                    top: 0,
                    left: 0,
                },
                fourth: {
                    top: 0,
                    left: 0,
                }
            },
            blue: {
                first: {
                    top: 0,
                    left: 0,
                },
                second: {
                    top: 0,
                    left: 0,
                },
                third: {
                    top: 0,
                    left: 0,
                },
                fourth: {
                    top: 0,
                    left: 0,
                }
            },
            green: {
                first: {
                    top: 0,
                    left: 0,
                },
                second: {
                    top: 0,
                    left: 0,
                },
                third: {
                    top: 0,
                    left: 0,
                },
                fourth: {
                    top: 0,
                    left: 0,
                }
            },
            yellow: {
                first: {
                    top: 0,
                    left: 0,
                },
                second: {
                    top: 0,
                    left: 0,
                },
                third: {
                    top: 0,
                    left: 0,
                },
                fourth: {
                    top: 0,
                    left: 0,
                }
            }
        }
    } else {
        ob[`place_${i
            }`
        ] = {
            red: {
                top: 0,
                left: 0,
            },
            blue: {
                top: 0,
                left: 0,
            },
            green: {
                top: 0,
                left: 0,
            },
            yellow: {
                top: 0,
                left: 0,
            }
        }
    }
}
console.log(JSON.stringify(ob))