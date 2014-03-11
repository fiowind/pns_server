/*
var ua_log = require('ualib').ua_log;
var log = new ua_log('DBG', 'msg_agent');
*/

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

	console.log(data);

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

	/* only test start */
	/*
	conf.sms.send++;

	setTimeout(function() {
		conf.sms.send--;
	}, 100);
	*/
	/* only test end */

	var req = http.request(option, function(res) {
		console.log('[SMS] STATUS: ' + res.statusCode);
		console.log('[SMS] HEADER: ' + JSON.stringify(res.headers));
		res.setEncoding('utf8');

		if (parseInt(res.statusCode, 10) !== 200) {
			_updateResult('fail', function(err, result) {
				if (err) throw err;
			});
			return;
		}

		res.on('data', function(chunk) {
			console.log('[SMS] BODY: ' + chunk);
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
		console.log ('[SMS] request error: ' + err);
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
exports.smsSender = smsSender;

function mmsSender(data) {

	console.log(data);

}
exports.mmsSender = mmsSender;

function gcmSender(data) {

	var message = new gcm.Message();
	var sender = new gcm.Sender(data.sender);
	var regid = [];

	message.addData('key1', data.message);
	message.collapseKey = 'collapsKey';
	message.delayWhileIdle = true;
	message.timeToLive = 3;

	regid.push(data.recver);

	sender.send(message, regid, 4, function(err, result) {
		if (err) console.log('[GCM] sender error: ' + err);
		console.log('[GCM] sender result: ' + JSON.stringify(result));
	});

	/*
	sender.sendNoRetry(message, regid, function(err, result) {	
		if (err) console.log('[GCM] sender error: ' + err);
		console.log('[GCM] sender result: ' + result);
	});
	*/	
}
exports.gcmSender = gcmSender;

function apnsSender(data) {

}
exports.apnsSender = apnsSender;

function uanSender(data) {
	console.log('[UAN] data: ' + data);
}
exports.uanSender = uanSender;

function mailSender(data) {

}
exports.mailSender = mailSender;
