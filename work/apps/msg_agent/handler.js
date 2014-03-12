
var http = require('http');
var url = require('url');
var qs = require('querystring');
var fs = require('fs');
var net = require('net');

var gcm = require('node-gcm');
var Iconv = require('iconv').Iconv;

var E2U = new Iconv('EUC-KR', 'UTF-8//TRANSLIT//IGNORE');
var U2E = new Iconv('UTF-8', 'EUC-KR//TRANSLIT//IGNORE');

function smsSender(data) {

	log.debug('[SMS] data : ' + data);

	try {
		var urlStr = config.sms.url + '?' +
					 'id=Svc' + '&' +
					 'op=sendsms' + '&' +
					 'smdn=' + data.sender_mdn + '&' +
					 'rmdn=' + data.receiver_mdn + '&' +
					 'call=' + data.callback_mdn + '&' +
					 'msg=' + escape(U2E.convert(data.text).toString('binary'));
	
		var urlObj = url.parse(urlStr);
	
		var option = {
			hostname: urlObj.hostname,
			port: urlObj.port,
			path: urlObj.path,
			method: 'GET'
		};
	
		var req = http.request(option, function(res) {
			log.debug('[SMS] STATUS: ' + res.statusCode);
			log.debug('[SMS] HEADER: ' + JSON.stringify(res.headers));
			res.setEncoding('utf8');
	
			if (parseInt(res.statusCode, 10) !== 200) {
				_updateResult('fail', function(err, result) {
					if (err) throw err;
				});
				return;
			}
	
			res.on('data', function(chunk) {
				log.debug('[SMS] BODY: ' + chunk);
				conf.sms.send--;
	
				if (chunk.toString() === 'RESULT=OK\n') {
					// update success
					_updateResult('success', function(err, result) {
						if (err) throw err;
					});
				}
				else {
					// update fail
					_updateResult('fail', function(err, result) {
						if (err) throw err;
					});
				}
			});
		});
	
		req.on('error', function(err) {
			log.error('[SMS] request error: ' + err);
		});
	
		conf.sms.send++;
		req.end();
	
		function _updateResult(resStatus, callback) {
			var sql = 'update push_sms set status = ?, sent_at = ?, attempted_retry_cnt = + 1, last_attemped_at = ? ' +
															'where tid = ?';
			var arg = [ resStatus, Date.now(), Date.now(), data.tid ];
			db.query(sql, arg, function(err, result) {
					callback(err, result);
			});
		}
	}
	catch (err) {
		throw err;
	}
}
exports.smsSender = smsSender;

function mmsSender(data) {

	try {
		log.debug('[MMS] data : ' + data);
	}
	catch (err) {
		throw err;
	}
	return;
}
exports.mmsSender = mmsSender;

function gcmSender(data) {
	
	try {
		var message = false;
		var sender = false;
		var regid = [];

		log.debug('[GCM] data : ' + data);

		message = new gcm.Message();
		sender = new gcm.Sender(data.api_key);
	
		if (data.text) {
			message.addDataWithKeyValue('text', data.text);
		}
		if (data.url) {
			message.addDataWithKeyValue('url', data.url);
		}
	
		//private static String COLLAPSE_KEY = String.valueOf(Math.random() % 100 + 1);
		message.collapseKey = 'collapsKey';
		message.delayWhileIdle = true;
		message.timeToLive = 3;
	
		regid.push(data.push_token);
	
		// sender.send(message, regid, 4, function(err, result)
		sender.sendNoRetry(message, regid, function(err, result) {	
			if (err) {
				log.error('[GCM] sender error: ' + err);
				_updateResult('fail', data.tid);
				throw err;
			}
	
			if (result) {
				log.info('[GCM] sender result: ' + JSON.stringify(result));
				_updateResult('success', data.tid);
			}
			else {
				log.error('[GCM] sender result: ' + JSON.stringify(result));
				_updateResult('fail', data.tid);
			}
		});

		function _updateResult(resStatus, tid) {
			var sql = 'update push_gcm set status = ?, sent_at = ?, attempted_retry_cnt = + 1, last_attemped_at = ? ' +
									'where tid = ?';
			var arg = [ resStatus, Date.now(), Date.now(), tid ];
			db.query(sql, arg, function(err, result) {
				if (err) {
					log.error('[GCM] _updateResult error tid = [' + tid + '] : ' + err);
					throw err;
				}
				log.info('[GCM] _updateResult sucess tid = [' + tid + '] : ' + JSON.stringify(result));
			});
		}
	}
	catch (err) {
		log.error('[GCM] gcmSender catch error : ' + err);
	}

}
exports.gcmSender = gcmSender;

function apnsSender(data) {
	return;
}
exports.apnsSender = apnsSender;

function uanSender(data) {
	console.log('[UAN] data: ' + data);

	try {
		var sql = '';	

		// select table device_connection
		sql = 'select * from device_connection ' + 
									'where device_id = ? ';
		arg = [ data.device_id ];
		db.query(sql, arg, function(err, rows) {
			if (err) throw err;

			if (rows.length <= 0) {
				_updateResult('unknown', function(err, result) {
					if (err) throw err;
				});
			}
			else {
				if (rows[0].is_connected === 'true') {
					pub.publish('direct', JSON.stringify(data));
					console.log('seokeun');
				}
				else {
					_updateResult('offline', function(err, result) {
						if (err) throw err;
					});
				}
			}
		});

		function _updateResult(resStatus, callback) {
			var sql = 'update push_direct set status = ?, sent_at = ?, attempted_retry_cnt = + 1, last_attempted_at = ? ' +
															'where tid = ?';
			var arg = [ resStatus, Date.now(), Date.now(), data.tid ];
			db.query(sql, arg, function(err, result) {
					callback(err, result);
			});
		}
	}
	catch (err) {
		console.log('_selectDeviceConnection() catch error : ' + err);
	}
	
	return;
}
exports.uanSender = uanSender;

function mailSender(data) {
	return;

}
exports.mailSender = mailSender;
