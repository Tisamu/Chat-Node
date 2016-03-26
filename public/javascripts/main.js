var local_ip = '192.168.1.24';
var pseudo;
var newColor;

function isBlank(str) {
    return (!str || /^\s*$/.test(str));
}

$(document).ready(function () {
    $('.modal-trigger').leanModal();
    $(".button-collapse").sideNav();

    //    Creating a random color
    //TODO assign a color by username

    //Creating connection with socket.io
    var socket = io.connect('http://' + local_ip + ':3000');

//______________________________/index__________________________

    function sendMessage() {

        //        JadeUsername is defined in the index.jade file;
        pseudo = jadeUsername;
        var message = $('#message').val();

//        Avoid js script insertion
//        TO DO escape html code injection also
//        TO DO escape html code injection also
        if (message.indexOf('<script>') !== -1) {
            alert('Message Denied !');
        } else {
            if (pseudo) {
                if (!isBlank(message)) {
                    socket.emit('message', {
                        pseudo: pseudo,
                        message: message
                    });

                    $('#message').val('');
                }
            } else {
                alert('Veuillez vous connecter.');
            }
        }

    }
    //    Send Message button
    $('#send').click(function () {
        sendMessage();
    });

    $('#message').on('keydown', function (e) {
        if (e.which === 13) {
            e.preventDefault();
            sendMessage();
        }
    });

//______________________________/register_________________________
    //    Register Button click
    $('#registerBtn').click(function () {
        var username = $('#username').val();
        var password = $('#password').val();
        $.post('/registerUser', {
            username: username,
            password: password
        }, function (data) {
            if (data === 'done') {
                //                Redirecting the user
                window.location.href = '/';
            }
        });
    });

//______________________________/login___________________________
    //    Login Button Click
    $('#connectBtn').click(function () {
        var username = $('#username').val();
        var password = $('#password').val();
        $.post('/loginUser', {
            username: username,
            password: password
        }, function (data) {
            if (data[0] === 'connect') {
                //              Redirecting the user
                socket.emit('userConnect', {
                    username: username,
                    color: data[1]
                });
                window.location.href = '/';
            } else if (data[0] === 'notfound') {
                Materialize.toast('Utilisateur inconnu', 4000);
            } else if (data[0] === 'wpass') {
                Materialize.toast('Mauvais Mot de Passe', 4000);
            }
        });
    });


//_______________________Socket Listening_________________________
    socket.on('connect', function () {
        if (typeof (jadeUsername) !== 'undefined') {
            socket.emit('userConnect', {
                username: jadeUsername,
                color: jadeColor
            });
        }

    });

    socket.on('userList', function (users) {
//        console.log('userList received');
        $('#members').html('');
        $.each(users, function (i, val) {
            $('#members').append('<p><b>' + val + '</b></p>');
        });
    });

    //    Checking messages
    socket.on('message', function (message) {
        //        console.log(message);
        $('#chatWindow').append(message);
        //        Scroll to the bottom of the Chat Window when adding a message
        $('#chatWindow').scrollTop($('#chatWindow')[0].scrollHeight);
    });

//______________________Profile Update________________________
    //Function to convert hex format to a rgb color
    function rgb2hex(orig) {
        var rgb = orig.replace(/\s/g, '').match(/^rgba?\((\d+),(\d+),(\d+)/i);
        return (rgb && rgb.length === 4) ? "#" +
                ("0" + parseInt(rgb[1], 10).toString(16)).slice(-2) +
                ("0" + parseInt(rgb[2], 10).toString(16)).slice(-2) +
                ("0" + parseInt(rgb[3], 10).toString(16)).slice(-2) : orig;
    }

    $('#profileColor').val(rgb2hex(jadeColor));

    $('#updateProfilebtn').click(function () {
        newColor = $('#profileColor').val();
        $.post('/updateUser', {
            username: jadeUsername,
            color: newColor
        }, function (data) {
            if (data === 'done') {
                window.location.href = '/';
            }
        });
    });
    $('#userAvatar').click(function () {
        $('#uploadAvatar').click();
    });

    $('#uploadAvatar').change(function () {
        $('#avatarForm').submit();
    });

});
