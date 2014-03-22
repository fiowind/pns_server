
global.conf = require('./config/conf');
var ua_log = require('ualib').ua_log;
global.log = new ua_log(conf.logLevel, conf.processName);
global.mysqlPool = false;
global.redisPub = false;

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
		log.info('proecess catch signal : SIGINT');
		_endProcess(0);
	});

	process.on('SIGTERM', function() {
		log.info('proecess catch signal : SIGTERM');
		_endProcess(0);
	});
}

function _doConnectMysqlPool(callback) {

	mysqlPool = mysql.createPool(conf.database.mysql);

	_connectCheck(callback);

	setInterval(function() {
		log.info('MySQL connect check...[1000*1800] sec');
		_connectCheck(null);
	}, 1000 * 1800);
	
	function _connectCheck(callback) {
		mysqlPool.getConnection(function(err, conn) {
			if (err) {
				log.error('_doConnectMysqlPool() : mysqlPool.getConnection() error : ' + err.stack);

				conf.database.mysql.status = false;
				mysqlPool.end();

				// reconnect
				setTimeout(function() {
					_doConnectMysqlPool(callback);
				}, 2000);
			}
			else {
				log.info('MySQL connect check ok...[once]');
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

	// auto reconnect 
	redisPub = redis.createClient();

	redisPub.on('error', function(err) {
		conf.database.redis.status = false;
		log.error(err);
	});

	redisPub.on('connect', function() {
		conf.database.redis.status = true;
		return process.nextTick(function() {
			callback(null, conf.database.redis.status);
		});
	});

	redisPub.on('end', function() {
		conf.database.redis.status = false;
		log.error('redis disconnected');
	});

}

function _initProcess(callback) {

	// get config
	if (global.conf) {
		global.conf = require('./config/conf');
	}
	
	// set log 
	if (global.log) {
		var ua_log = require('ualib').ua_log;
		global.log = new ua_log(conf.logLevel, conf.processName);
	}

	// signal Handler
	_signalHandler();

	// database Connect
	async.series([
		function(cb) {
			global.mysqlPool = false;
			_doConnectMysqlPool(function(err, status) {
				cb(err, status);
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
		if (err) callback(err):
		else {
			if (results[0] && results[1]) {
				callback(null);	
			}
			else {
				callback(new Error('database connect fail. mysql = [' + results[0] + '], redis = [' + results[1] + ']'));
			}
		}
	});
}

function _doProcess(callback) {

	var handle = {};
	handle['SMS'] 	= handler.smsSender;
	handle['MMS'] 	= handler.mmsSender;
	handle['GCM'] 	= handler.gcmSender;
	handle['APNS'] 	= handler.apnsSender;
	handle['UAPNS']	= handler.uapnsSender;

	server.start(router.route, handle);

	return process.nextTick(function() {
		callback(null);
	});
}

function _endProcess(code) {

	setTimeout(function() {
		if (mysqlPool) mysqlPool.end();
		if (redisPub) redisPub.end();
		process.exit(code);
	}, 1000);
}

main.on('error', function(err) {
	log.error(err.stack);

	try {
		// error handle
		_endProcess(-1);
	}
	catch (catchErr) {
		log.error('main.on catchErr : ' + err);
	}
});

main.run(function() {

	_initProcess(function(err) {
		if (err) throw err;

		_doProcess(function(err) {
			if (err) throw err;
		});
	});

});
