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


	// only test start
	data.tid = 12345;
	data.comapign_id = 12345;
	data.app_client_id = 12345;
	data.target = 'SMS';
	data.sender_mdn = '01035085273';
	data.receiver_mdn = '01035085273';
	data.callback_mdn = '01035085273';
	data.requested_at = Date.now();
	data.scheduled_at = Date.now();
	data.send_at = Date.now();
	data.maxmum_retry_cnt = 5;
	data.attempted_retry_cnt = Date.now();
	data.last_attemped_at = Date.now();
	data.text = 'test message 한글';
	data.status = 'Requesting';
	// only test end

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
	conf.sms.send++;

	setTimeout(function() {
		conf.sms.send--;
	}, 100);
	/* only test end */

	/*
	var req = http.request(option, function(res) {
		console.log('[SMS] STATUS: ' + res.statusCode);
		console.log('[SMS] HEADER: ' + JSON.stringify(res.headers));
		res.setEncoding('utf8');

		if (res.statusCode !== '200') {
			// update fail
		}

		res.on('data', function(chunk) {
			console.log('[SMS] BODY: ' + chunk);
			conf.sms.send--;

			if (chunk === 'RESULT=OK') {
				// update success
				_updateResult(3, function(err, result) {
					
				});
			}
			else {
				// update fail
				_updateResult(3, function(err, result) {
					
				});
			}
		});
	});

	req.on('error', function(err) {
		console.log ('[SMS] request error: ' + err);
	});

	req.end();
	conf.sms.send++;
	*/

	function _updateResult(callback) {
		var sql = 'update tbl_seo set id = ? where seq = ?';
		var arg = [ 3, data.seq, data ];
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
