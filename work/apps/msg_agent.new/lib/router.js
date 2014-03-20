
function route(handle, type, data) {
	if (typeof handle[type] === 'function') {
		handle[type](data);
	}
	else {
		log.info('route() error...' + data);
	}
}

exports.route = route;
