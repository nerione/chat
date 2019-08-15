'use strict'

var express = require('express'),
    propertiesReader = require('properties-reader'),
    app = express(),
    http = require('http').createServer(app),
    io = require('socket.io')(http),
    publicDir = express.static(`${__dirname}/public`),
    usersConnected = [],
    operadoresConectados = [],
    ajustadoresConectados = [],
    ajustadoresList = ['AJUSTADOR 1', 'AJUSTADOR 2', 'AJUSTADOR 3'],
    operadoresList = ['Operador 1','Operador 2', 'Operador 3'],
    userRol=['Ajustador','Operador'],
    userNames = ['Juan', 'Pedro', 'Carlos', 'Antonio', 'Damian', 'Raúl', 'Jimena', 'Daniel'],
    properties = propertiesReader(`${__dirname}/public/properties/app.properties`),
    //port = process.env.PORT || properties.get('configuration.app.server.port'),
    
    // when on Heroku, port will be exported to an environment variable
    // and available as process.env.PORT
    port = process.env.PORT || CONFIG.port;
    
    port = process.env.PORT || properties.get('configuration.app.server.port'),
    //indiceRol = 0,
    indiceAssgin = 0,
    //Lista de canales por tipo de usuario
    nspO = io.of('/operador'),
    nspA = io.of('/ajustador')

    //Politca CORS
    //io.set( 'origins', '*domain.com*:*' )

app.use(publicDir)
    
    .get('/operador', (req, res) =>{
        res.sendfile("public/views/operador.html")
    })

    .get('/ajustador', (req, res) =>{
        res.sendfile("public/views/ajustador.html")
    })

    

http.listen(port, () =>{
    console.log('Express started on port %d', port)
})


//instancia de io para escuchar operadores
nspO.on('connection',(socket) => {
    console.log("UN OPERADOR HA INICIADO SESION...")
    
    //Agregamos nuevo usuario a la lista
    addUser(socket)
    
    //Mensaje de inicio de sesion al cliente (Operador/Ajustador)
    socket.emit('welcome', 'Operador ' + socket.userName + ' on line')

    socket.broadcast.emit('addedUser',{mensaje: "El " + socket.userRol + " "+ socket.userName + " está en línea"})

    //Mensaje desde el formulario a los clientes con el mismo namespace /Operador
    /*socket.on('new message', (mensaje) =>{
        console.log(mensaje + " de "+ socket.userName)
        nspO.emit('user says',socket.userName + ' : ' + mensaje)
    })*/

    //Mensajes entre operador y ajustador diferente namespace
    socket.on('new message', (mensaje) =>{
        console.log(mensaje + " de "+ socket.userName)
        nspA.to(ajustadoresConectados[0].id).emit('user says',socket.userName + ' : ' + mensaje)
        nspO.emit('user says',socket.userName + ' : ' + mensaje)
    })



    //Indicamos al ajstador que un operador está en linea.
    nspA.to(ajustadoresConectados[0].id).emit('aviso', 'ajustador en linea.');

    //Cierre de sesión
    socket.on('disconnect', () =>{
        socket.broadcast.emit('user off', {mensaje : socket.userName + ' ha abandonado el chat'})
        console.log(`Dando de baja APERADOR...`)
        removeUser(socket)
        console.log('Un usuario ha cerrado sesion.')
    })
})

//instancia de io para escuchar ajustadores
nspA.on('connection',(socket) => {
    console.log("UN AJUSTADOR HA INICIADO SESION...")
    //Se agrega usuario
    addUser(socket)

    //Mensaje inicial mismo cliente que se conecta
    socket.emit('welcome', 'Ajustador ' + socket.userName + ' on line')

    //compartir imagen a un OPERADOR
    socket.on('user image', (imagenB64)=>{
        //ENVIANDO IMAGEN...
        nspO.to(operadoresConectados[0].id).emit('addimagen', 'Imagen enviada. ', imagenB64);
        //nspO.to(operadoresConectados[0].id).emit('aviso', 'ajustador en linea.');

    })

    socket.broadcast.emit('addedUser',{mensaje: "El " + socket.userRol + " "+ socket.userName + " está en línea"})

    //Mensaje desde el formulario a los clientes con el mismo namespace /ajustador
    socket.on('new message', (mensaje) =>{
        console.log(mensaje + " de "+ socket.userName)
        nspO.to(operadoresConectados[0].id).emit('user says',socket.userName + ' : ' + mensaje)
        nspA.emit('user says',socket.userName + ' : ' + mensaje)
    })


    //Cierre de sesión
    socket.on('disconnect', () =>{
        socket.broadcast.emit('user off', {mensaje : socket.userName + ' ha abandonado el chat'})
        console.log(`Dando de baja AJUTADOR...`)
        removeUser(socket)
        console.log('Un usuario ha cerrado sesion.')
    })

})



//Seervidor websockets
/*
io.on('connection', (socket) =>{
    //Agregamos el nuevo usuario a la lista de usuarios activos
    //addUser(socket)
    
    console.log("El " + socket.userRol + " " + socket.userName + ' ha iniciado sesión.')
    
        //io.to(usersConnected[0]).emit('welcome', 'Nuevo usuario: '+ socket.id)
    socket.emit('welcome', 'Bienvenido ' +  socket.userRol + " " +socket.userName)
    socket.broadcast.emit('addedUser',{mensaje: "El " + socket.userRol + " "+ socket.userName + " está en línea"})

    //socket.to(socket.id).emit('welcomer',{mensaje: "chido"})


    socket.on('new message', (mensaje) =>{
        console.log(mensaje + " de "+ socket.userName)
        io.emit('user says',socket.userName + ' : ' + mensaje)
    })

    socket.on('disconnect', () =>{
        socket.broadcast.emit('user off', {mensaje : socket.userName + ' ha abandonado el chat'})
        console.log(`Dando de baja usuario...`)
        removeUser(socket)
        console.log('Un usuario ha cerrado sesion.')
    })

})*/

//Eliminamos usuario de la lista de usuarios activos
function removeUser(socket){
    console.log('Antes de eliminar usuario: ' + usersConnected)
    var userIndex = usersConnected.indexOf(socket.id)
    console.log('Posicion a eliminar del arreglo: ' + userIndex)
    usersConnected.splice(userIndex,1)
    console.log('Usuarios conectados post delete: ' + usersConnected)
}

//Agregamos usuarios nuevos a la lista de usuarios activos
function addUser(socket){
    socket.userName = userNames[indiceAssgin]
    socket.userRol = userRol[indiceAssgin]
    socket.areBussy = false

    //simulamos rol para agregarlos a la pila correspondiente
    if(socket.userRol === "Operador" )
    {
        operadoresConectados.push(socket)
        //Creamos una conexion unica por operador para la atencion de los ajustadores
        createRoom(socket)
        //var users = io.sockets.clients()
    }
    else
    {
        ajustadoresConectados.push(socket)
    }

    //logs
    if(operadoresConectados.length > 0)
        console.log('Operadores conectados: ' + operadoresConectados[operadoresConectados.length -1].userName)
    if(ajustadoresConectados.length > 0)
        console.log('Ajustadores conectados: ' + ajustadoresConectados[ajustadoresConectados.length -1].userName )

    indiceAssgin++
}

//Creamos un nuevo room por operador en sesion.
function createRoom(socket){
    //make one socket room by Operator NAME
    console.info("Se ha creado un nuevo ROOM " + "/room:"+socket.userName)
    socket.join("room:"+socket.userName)
}

//Agregamos usuarios a room para comunicacion uno a uno.
function addUsersToRoom(socket){
    //Se agrega un nuevo ajustador al canal del ajustador
    socket.join("room:"+socket.userName)
}
