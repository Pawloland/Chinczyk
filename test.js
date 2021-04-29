let i = 0
let id = setInterval(function doThis() {
    console.log(Date.now());
    console.log('world', i);
    i++
    if (i == 11) {
        clearInterval(id)
    }
    return doThis; // to jest fajny trik, żeby setInterval zaczął wykonywać się od razu, a nie dopiero po timeoucie,
    // fajny trik  który trzeba dokładnie wytłumaczyć :)
    //
    // funckja ma zadeklarowaną nazwę -> doThis
    //
    // funckcja samoistnie się wykonuje, bo są po niej () na końcu -> }(), 1000);
    //
    // dlatego, że funkcja się wykonje, a nie jest podana jako parametr to musi coś zwrócić, bo inaczej 
    // setinterval widziałby tylko undefined, zamiast naszej funkcji -> setInterval(undefined, 1000)
    //
    // w tym celu funckja zwraca samą siębie -> return doThis
    //
    // gdzy funkcja zwara samą siebie , to setinterval już wie co 
    // ma się dziać -> setInterval(doThis(), 1000)
    //
    // po określonym czasie zwrócona funkcja jest wywołana pierwszy raz przez setInterval, po 1000 ms -> doThis()
    //
    // doThis() wykona swoją zawartość i znów zwróci samego siebie, ale tym razem, zwracana wartość 
    // z funkcji, która jest parametrem setinterval nie jest już nijak przez setinterval do czegokolwek 
    // używana, więc tak jakby nic jż nie robi
    //
    // przy okreśonym warunku czyścimy interval -> clearInterval(id)
    //
    // wyczyszczenie interval-u sprawia, że setinterval nie będzie już więcej wywoływał na nowo funkcji 
    // podanej jako parametr, ale funckja która jest już wywołana i jest w trakcjie wywoływania, 
    // dojdzie do końca i znowu zwróci samą siebie, ale to nie jest nijak przez nic już wykorzystywane, 
    // więc to w sumie nie robi nic
}(), 1000);