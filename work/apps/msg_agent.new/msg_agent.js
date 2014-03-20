
global.conf = require('./config/conf');
var ua_log = require('ualib').ua_log;
global.log = new ua_log(conf.logLevel, conf.processName);

var domain = require('domain');
var main = domain.create();

var mysql = require('mysql');
var redis = require('redis');
var async = require('async');

var server = require('./lib/server');
var router = require('./lib/router');
var handler = require('./lib/handler');

function _signalHandler() {
	process.on('SIGINT', function() {
		console.log('proecess catch signal : SIGINT');
		_endProcess(0);
	});

	process.on('SIGTERM', function() {
		console.log('proecess catch signal : SIGTERM');
		_endProcess(0);
	});
}

function _doConnectMysqlPool(callback) {

	mysqlPool = mysql.createPool(conf.database.mysql);

	connectCheck(callback);

	setInterval(function() {
		console.log('MySQL connect check...[1000*1800] sec');
		connectCheck(null);
	}, 1000 * 1800);
	
	function connectCheck(callback) {
		mysqlPool.getConnection(function(err, conn) {
			if (err) {
				console.log('_doConnectMysqlPool() : mysqlPool.getConnection() error : ' + err.stack);

				conf.database.mysql.status = false;
				mysqlPool.end();

				// reconnect
				setTimeout(function() {
					_doConnectMysqlPool(callback);
				}, 2000);
			}
			else{
				console.log('MySQL connect check ok...[once]');
				conn.release();
				conf.database.mysql.status = true;
				if (typeof callback === 'function') {
					return process.nextTick(function() {
						callback(null, conf.database.mysql.status);
					});
				}
				else {
					return;
				}
			}
		});
	}
}

function _doConnectRedis(callback) {

	redisPub = redis.createClient();

	// auto reconnect 
	redisPub.on('error', function(err) {
		conf.database.redis.status = false;
		console.log(err);
	});

	redisPub.on('connect', function() {
		conf.database.redis.status = true;
		return process.nextTick(function() {
			callback(null, conf.database.redis.status);
		});
	});

	redisPub.on('end', function() {
		conf.database.redis.status = false;
		console.log('redis disconnected');
	});

}

function _initProcess(argv, callback) {

	// get config
	if (global.conf) {
		global.conf = require('./config/conf');
	}
	
	// set log 
	if (global.log) {
		var ua_log = require('ualib').ua_log;
		global.log = new ua_log(conf.logLevel, conf.processName);
	}

	async.series([
		function(cb) {
			global.mysqlPool = false;
			_doConnectMysqlPool(function(err, status) {
				if (err) callback(err, false);
				cb(null, status);
			});			
		},
		function(cb) {
			global.redisPub = false;
			_doConnectRedis(function(err, status) {
				if (err) callback(err, false);
				cb(null, status);
			});	
		}
	],
	function(err, results) {
		if (err) throw err;
		if (results[0] && results[1]) {
			return process.nextTick(function() {
				callback(null);	
			});
		}
	});

	// signal handler
	_signalHandler();
}

function _doProcess(callback) {

	var handle = {};
	handle['SMS'] 	= handle.smsSender;
	handle['MMS'] 	= handle.mmsSender;
	handle['GCM'] 	= handle.gcmSender;
	handle['APNS'] 	= handle.apnsSender;
	handle['UAPNS']	= handle.uapnsSender;
	handle['MAIL']	= handle.mailSender;

	server.start(router.route, handle);

	return process.nextTick(function() {
		callback(null);
	});
}

function _endProcess(code) {
	if (mysqlPool) mysqlPool.end();
	if (redisPub) redisPub.end();
	process.exit(code);
}

main.on('error', function(err) {
	console.log(err.stack);

	try {
		// error handle
		_endProcess(-1);
	}
	catch (catchErr) {
		log.error('main.on catchErr : ' + err);
	}
});

main.run(function() {

	_initProcess(process.argv, function(err) {
		if (err) throw err;

		_doProcess(function(err) {
			if (err) throw err;
		});
	});

});
