var request = require('request');

var points = {
	'Contributing document': /contributing.(txt|md)/i,
	'Readme document': /readme.(txt|md)/i,
	'Licence document': /licence.(txt|md)/i,
};

function forkability(username, repo, callback) {
	var present = [];
	var missing = [];
	var warnings = [];
	var congrats = [];
	request.get({
		url: 'https://api.github.com/repos/' + username + '/' + repo + '/commits',
		headers: {
			'User-Agent': 'Forkability'
		},
		json: true
	}, function(err, response, data) {
		var sha = data[0].sha;
		var url = 'https://api.github.com/repos/' + username + '/' + repo + '/git/trees/' + sha;
		// console.log(data[0]);
		// return;
		request.get({
			url: url,
			headers: {
				'User-Agent': 'Forkability'
			},
			json: true
		}, function(err, response, data) {
			// console.log(data);
			var pointKeys = Object.keys(points);
			pointKeys.forEach(function(p) {
				var found = false;
				var i;
				for (i = data.tree.length - 1; i >= 0; i--) {
					// console.log(data.tree[i])
					if (points[p].test(data.tree[i].path)) {
						found = true;
						break;
					}
				}
				if (found) {
					present.push(p);
				} else {
					missing.push(p);
				}
			});

			request.get({
				url: 'https://api.github.com/repos/' + username + '/' + repo + '/issues?state=open',
				headers: {
					'User-Agent': 'Forkability'
				},
				json: true
			}, function(err, response, data) {
				// console.log(data);

				data.forEach(function(issue) {
					if (issue.user.login !== username && issue.comments === 0) {
						warnings.push({
							message: 'Uncommented issue',
							details: {
								url: issue.html_url,
								title: issue.title
							}
						});
					}
				});

				callback(present, missing, warnings);
			});
		});
	});
}

module.exports = forkability;