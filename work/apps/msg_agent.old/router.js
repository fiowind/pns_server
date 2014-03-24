
function route(handle, type, data) {

	if (typeof handle[type] === 'function') {
		handle[type](data);
	}
	else {
		console.log('router error...' + data);
	}
}

exports.route = route;
