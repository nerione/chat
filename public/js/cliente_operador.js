(function(d,io_instance, $){
    'use strict'
    
    //Constructor socket io para operador
    const io = io_instance('/operador')
    //Constructor socket io para ajustador
    //const io = io_instance('/ajustador')

    //Evento para manejar el envio de mensajes desde el formulario
    $('#chat-form').on('submit', function(e){
        e.preventDefault()
        io.emit('new message', $('#message-text').val())
        $('#message-text').val(null)
        //io.emit('prueba',{userId: 'Nerione', message:'Hola', receptors: ['neri','luis'] })
        return false;
    })
    //cacha mensajes de evento new user
    io.on('addedUser', function(newUser){
        //$('#rol').val(newUser.rol)
        alert(newUser.mensaje)
    })

    //Mensaje de bienvenida al usuario recien conectado
    io.on('welcome', function(mensaje){
        $('#chat').append('<strong><li><em>' + mensaje+ '</em></li></strong>')
        return false
    })

    //cacha mensajes de evento user says y los agrega al elemento #chat del DOM
    io.on('user says', function(msg){
        console.log(msg)
        $('#chat').append('<li>' + msg + '</li>')
    })

    //cacha el evento de desconexion de un cliente
    io.on('user off', function(usuarioOff){
        $('#chat').append('<div style="color:red; text-align:center;"><em>' + usuarioOff.mensaje + '</em></div>')
        return false;
    })

    io.on('addimagen', function(mensaje, base64image){
        $('#chat').append('<img src = '+ base64image + '/> ')
    })
    
})(document,io, jQuery)