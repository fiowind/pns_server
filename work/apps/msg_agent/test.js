
var redis = require('redis');

var pub = redis.createClient();

pub.on('error', function(err) {
	console.log('pub error : ' + err);
});


var msg = { type: 'UAN', tid: '140228111111123456' sender: '01035085273', recver: '01035085273', callback: '01035085273', message: 'test message 한글' };


//while(1) {

	setInterval(function() {
	pub.publish ('seotest', JSON.stringify(msg));
	pub.publish ('seotest', JSON.stringify(msg));
	pub.publish ('seotest', JSON.stringify(msg));
	pub.publish ('seotest', JSON.stringify(msg));
	pub.publish ('seotest', JSON.stringify(msg));
	pub.publish ('seotest', JSON.stringify(msg));
	pub.publish ('seotest', JSON.stringify(msg));
	pub.publish ('seotest', JSON.stringify(msg));
	pub.publish ('seotest', JSON.stringify(msg));
	pub.publish ('seotest', JSON.stringify(msg));
	pub.publish ('seotest', JSON.stringify(msg));
	pub.publish ('seotest', JSON.stringify(msg));
	pub.publish ('seotest', JSON.stringify(msg));
	pub.publish ('seotest', JSON.stringify(msg));
	pub.publish ('seotest', JSON.stringify(msg));
	pub.publish ('seotest', JSON.stringify(msg));
	pub.publish ('seotest', JSON.stringify(msg));
	pub.publish ('seotest', JSON.stringify(msg));
	console.log('while');
	}, 100);
//}

/*
msg = {
	type: 'GCM',
	sender: 'AIzaSyBj1Tpm53u5EC479hNgWT6h9xJUfgxvc5g',
	recver: 'APA91bG1F51ju4HdNj1MgzAypqw1WjdkP4CKIh4p5Hms7fh2vJa6R77KuFRUswsayzch15_5K39rqhLkiZKIsrkHFCSWOFeKglO9XjAGvycj3exqnGpMj8jCsmaJv-E0MCGNNt8R3Cq1lGft3b0Y8AGVYxXGAHYSug',
	callback: '',
	message: 'test message 한글'
};
db.rpush ('message', JSON.stringify(msg));
*/

//pub.quit();

/* 
Queue insert 타입.. 샘플 : 수정 필요

{ type: 'SMS', tid: '140228111111123456' sender: '01035085273', recver: '01035085273', callback: '01035085273', message: 'test message 한글' }
{ type: 'MMS', tid: '140228111111123456' sender: '01035085273', recver: '01035085273', callback: '01035085273', message: 'test message 한글', image:[{jpg:path}] }
{ type: 'GCM', tid: '140228111111123456' sender: 'api-key', recver: 'reg-id', callback: '', message: 'test message 한글' }

기타 .. 확인 후 수정
*/
