
var net = require('net');

var max = parseInt(process.argv[2], 10) || 100;
var socket = [];
var cnt = 0;

for (var i = 0; i < max; i++) {
	socket[i] = new net.Socket();
	socket[i].setMaxListeners(0);
	socket[i].setNoDelay(true);
	socket[i].setKeepAlive(true);

	start(socket[i], {port: 8124, host: '192.168.2.81'});
}

function start(socket, option) {

	socket.connect(option, function() {
		// skip
		cnt++;
	});

	socket.on('connect', function() {
		// skip
	});

	socket.on('close', function() {
		console.log('[clos] : socket close');
		socket.destroy();

		setTimeout(function() {
			socket.connect(option, function() {
				// skip
			});
		}, 1000);
	})

	socket.on('error', function(err) {
		console.log('[erro] : ' + err);
	});

	socket.on('data', function(data) {
		console.log('[data] : ' + data);
	});
}

setInterval(function() {
	console.log('connect count = ' + cnt);
}, 1000);
