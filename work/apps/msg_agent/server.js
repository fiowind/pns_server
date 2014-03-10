
var domain = require('domain');
var mysql = require('mysql');

function start(route, handle) {

	try {
		var ret = false;

		console.log('server started!!!');

		// init process
		_initProcess(function(err) {
			if (err) throw err;

			// do process
			_doProcess(route, handle, function(err) {
				if (err) throw err;
			});
		});
	}
	catch (err) {
		console.log ('start() catch error : ' + err);

		// end Process
		_endProcess(function(err) {
			if (err) process.exit(-1);
		});
	}
}
exports.start = start;

function _initProcess(callback) {

	try {
		// init config
		global.conf = require('./config');

		// init log
		var ua_log = require('ualib').ua_log;
		global.log = new ua_log(conf.logLevel, conf.processName);

		// connect db
		global.db = false;
		_doConnectDB();

		// 추후 사용
		callback(null);
	}
	catch (err) {
		console.log('_initProcess() catch error : ' + err);
		callback(err);
	}
}

function _doConnectDB() {

	try {
		db  = mysql.createConnection(conf.database.mysql);
		// connect db
		db.connect(function(err) {
			if (err) {
				console.log('error where connection to db:', err);
				conf.status.db = false;
				setTimeout(_doConnectDB, 2000);
			}
			else {
				conf.status.db = true;
				console.log('db connect ok...');
			}
		});

		// check db
		db.on('error', function(err) {
			console.log('db error', err);
			if (err.code === 'PROTOCOL_CONNECTION_LOST') {
				conf.status.db = false;
				db = _doConnectDB();
			}
			else {
				throw err;
			}
		});
	}
	catch (err) {
		console.log('_doConnectDB() catch error : ' + err);
		return false;
	}
}

function _doProcess(route, handle, callback) {

	try {
		var sql = '';
		var arg = [];

		setInterval(function() {
			if (conf.status.db) {
				_getQueueRouteSMS(route, handle);
				_getQueueRouteMMS(route, handle);
				_getQueueRouteGCM(route, handle);
				_getQueueRouteAPNS(route, handle);
				_getQueueRouteUAN(route, handle);
			}

			// 추후 사용
			callback(null);
		}, 1000);

	}
	catch (err) {
		console.log('_doProcess() error : ' + err);
		callback(err);
	}
}

function _endProcess(callback) {

	try {
		if (conf.status.db) {
			conf.status.db = false;
			db.end();
		}
		process.exit(0);
		return callback(null);
	}
	catch (err) {
		console.log('_endProcess() error : ' + err);
		return callback(err);
	}
}


function _getQueueRouteSMS(route, handle) {

	try {


		if (conf.sms.send >= conf.sms.tps) {
			console.log('sms tps over!! send [' + conf.sms.send + '>=' + conf.sms.tps + '] tps');
			return;
		}
		else {
			db.beginTransaction(function(err) {
				if (err) throw err;
	
				sql = 'select * from tbl_seo where id = 3 limit ' + conf.sms.tps;
				db.query(sql, function(err, rows) {
					if (err) throw err;
	
					console.log('select rows.length = ['+rows.length+']');
					for (var i = 0; i < rows.length; i++) {
						sql = 'update tbl_seo set id = ? where seq = ?';
						arg = [ 2, rows[i].seq, rows[i] ];
						db.query(sql, arg, function(err, result) {
						if (err) {
								db.rollback(function() {
									throw err;
								});
							};
							db.commit(function(err) {
								if (err) {
									db.rollback(function() {
										throw err;
									});
								}
								console.log('update success!');
								// do send 
								route(handle, 'SMS', arg[arg.length-1]);
							}); // end commit
						}); // end update
					} // end for
				}); // end select
			}); // end transaction
		} // end if idle
	}
	catch (err) {
		throw err;
	}
}

function _getQueueRouteMMS(route, handle) {
	return;
}

function _getQueueRouteGCM(route, handle) {
	return;
}

function _getQueueRouteAPNS(route, handle) {
	return;
}

function _getQueueRouteAPNS(route, handle) {
	return;
}

function _getQueueRouteUAN() {
	return;
}





// exception
process.on('uncaughtException', function(err) {
	  console.log('Caught exception: ' + err);
});

// kill -1
process.on('SIGHUP', function() {
	conf.status.db = false;
	
	setTimeout(function() {
		console.log('config reloaded.');
		global.conf = require('./config');
	}, 1000);
});

// kill -2
process.on('SIGINT', function() {
	conf.status.db = false;

	setTimeout(function() {
		db.end();
		console.log('process exit.');
		process.exit(0);
	}, 1000);
});

// kill -15
process.on('SIGTERM', function() {
	conf.status.db = false;

	setTimeout(function() {
		db.end();
		console.log('process exit.');
		process.exit(0);
	}, 1000);
});
