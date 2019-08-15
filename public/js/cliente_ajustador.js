(function(d,io_instance, $){
    'use strict'
    
    //Constructor socket io para operador
    const io = io_instance('/ajustador')
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

    //evento de envio de imagen desde el form
    $('#imagefile').on('change', function(e){
        var file = e.originalEvent.target.files[0]
        var reader = new FileReader()
        reader.onload = function(evt){
            io.emit('user image',evt.target.result)
        }
        reader.readAsDataURL(file)
    })


    //cacha mensajes de evento new user
    io.on('addedUser', function(newUser){
        //$('#rol').val(newUser.rol)
        alert(newUser.mensaje)
    })

    io.on('aviso', function(mensaje){
        alert("Operador en linea.")
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
    

    //Evento para agregar imagenes
    //io.on('addimage', function(from, base64image){

    //})

})(document,io, jQuery)