
var net = require('net');

var max = parseInt(process.argv[2], 10) || 100;
var socket = [];
var cnt = 0;

for (var i = 0; i < max; i++) {
	socket[i] = new net.Socket();
	socket[i].setMaxListeners(0);
	socket[i].setNoDelay(true);
	socket[i].setKeepAlive(true);

	start(socket[i], {port: 8081, host: 'localhost'});
}

function start(socket, option) {

	var ret = false;
	var recvLen = 0;
	var recvStr = '';
	var sendLen = 0;
	var sendStr = '7::9999+아직 개발 안됐어요ㅠㅠ';
	var temp = false;
	var date = new Date();

	socket.connect(option, function() {
		// skip
		cnt++;
	});

	socket.on('connect', function() {
		// skip
		var uniq_key = '459106046051829';

		sendStr = '1::' + uniq_key;
		ret = sendToSocket(socket, sendStr);
		if (!ret) {
			// error
		}

/*
		sendStr = '5:::{"name": "pool", "args": ["client", {"device_id", "459106046051829"}]';
		ret = sendToSocket(socket, sendStr);
		if (!ret) {
			// error
		}
*/

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

	socket.on('data', function(buf) {
		console.log('[data] : ' + buf);
		recvLen = buf.readInt32BE(0);
		recvStr = buf.toString('utf8', 4, 4 + recvLen);

		if (recvStr[0] === '5') {
			var a = recvStr.indexOf('{');
			var b = JSON.parse(recvStr.slice(a));
			console.log(b.args[1]);

			sendStr = '6:::' + b.args[1].tid + '+0';
			console.log('--->sendStr : ' + sendStr);
			ret = sendToSocket(socket, sendStr);
			if (!ret) {
				// error
			}
		}

		console.log(recvLen);
		console.log(recvStr);
	});
}

function sendToSocket(socket, msg) {

	try {
		var buf = new Buffer(4 + msg.length);
		buf.writeInt32BE(msg.length, 0);
		buf.write(msg, 4, msg.length);

		console.log(buf);

		socket.write(buf);
		return true;
	}
	catch (err) {
		console.log('sendToSocket : ' + err);
		return false;
	}
}

setInterval(function() {
	console.log('connect count = ' + cnt);
}, 1000);
