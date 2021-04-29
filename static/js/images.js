export default class Images {
    static array = [
        '1',
        '2',
        '3',
        '4',
        '5',
        '6',
        'favicon',
        'red_piece',
        'blue_piece',
        'green_piece',
        'yellow_piece',
        'white_piece',
        'projection_piece',
        'plansza_edited'
    ]

    static async loadImages() {
        Images.images = Object.fromEntries(
            await Promise.all(
                Images.array.map(name => {
                    return new Promise((resolve, reject) => {
                        let newImage = new Image
                        newImage.src = `/img/${name}.png`
                        newImage.addEventListener('load', () => {
                            resolve([name, newImage])
                        })
                    })
                })
            )
        )
    }

    static getImage(name) {
        return Images.images[name.toString()]
    }
}