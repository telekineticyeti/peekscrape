var http = require("http");
var https = require("https");
var moment = require("moment");
var fs = require("fs");

// Location of configuration file to use.
// Use full path if invoking script via cron.
var config_file = "config.json";

// Load Config file
var config = (function() {
	try {
		fs.accessSync(config_file, fs.F_OK);
	} catch (e) {
		console.log(e.message);
		process.exit();
	}

	var file = fs.readFileSync(config_file),
		json = JSON.parse(file);

	return json;
})();

// Iterate through each target specified in the configuration file
// Retrieve the HTML for each targets' host/path/focus, and process it
// accordingly.
(function() {
	for (var i = 0; i < config.targets.length; i++) {
		var site = config.targets[i];

		if (!site.method || site.method === "http") {
			html = RetrieveHTML(site.host, site.path, i, ProcessHTML);
		} else if (site.method === "https") {
			html = RetrieveHTML(site.host, site.path, i, ProcessHTML, true);
		}
	}
})();

// Retrieve the target HTML using http.get and pass the result to the
// ProcessHTML() callback once complete.
function RetrieveHTML (host, path, key, callback, ssl=false) {
	var options = {
		host: host,
		path: path
	};

	if (!ssl) {
		http.get(options, function (response) {
			var data = "";

			response.on("data", function (chunk) {
				data += chunk;
			});

			response.on("end", function () {
				callback(key, data);
			});
		}).end();
	} else {
		https.get(options, function (response) {
			var data = "";

			response.on("data", function (chunk) {
				data += chunk;
			});

			response.on("end", function () {
				callback(key, data);
			});
		}).end();
	}

}

// Process Retrieved HTML
// Using jsdom and jQuery, All HTML with the exception of the target's 'focus'
// node is discarded.
// The resulting HTML is compared with the 'snippet' node for that target (if
// it exists). If snippet does not exist, the HTML is written to that node and
// saved.
function ProcessHTML(key, data) {

	function trimHTMLFocus(callback) {
		var jsdom = require("jsdom");
		var html_output;

		jsdom.env({
			html: data,
			scripts: ["http://code.jquery.com/jquery.js"],
			done: function(e, w) {
				html_output = w.$(config.targets[key].focus).html().trim();
				return callback(html_output);
			}
		});
	}


	var compare = trimHTMLFocus(function(html) {
		// A reference to the current target
		var target = config.targets[key];

		// Append a snippet result to the config object.
		// Prettify the config and overwrite the config file, saving the snippet.
		function AppendNode(node, content) {
			target[node] = content;
		}

		// If the target lacks a snippet node (first time running), create it.
		if (!('snippet' in target) || target.snippet == "") {
			console.log('Target [' + target.host + '] has no saved snippets; creating it.');
			AppendNode("snippet", html);
		}

		// If the target has a saved snippet node run a comparison with the newly fetched snippet.
		else {
			console.log('Target [' + target.host + '] Has a saved snippet; running comparison');

			var old_html = target.snippet;

			if (html === old_html) {
				console.log('Target [' + target.host + '] Snippets are identical, no change detected.');
			}

			else {
				console.log('Target [' + target.host + '] ALERT: Snippets are different!');
				PushNotify(target.host + target.path);

				// Write the new snippet, and keep a copy of the old snippet for debug purposes.
				AppendNode("snippet", html);
				AppendNode("old_snippet", old_html);
			}

		}

		AppendNode("last_checked", moment().format('MMMM Do YYYY, h:mm:ss a'));
		// Prettify the config and overwrite the config file with the new contents.
		fs.writeFile(config_file, JSON.stringify(config, null, "\t"));

	});
}


function PushNotify(url) {
	var PushBullet = require('pushbullet'),
		pusher = new PushBullet(config.pushbullet.api_key),
		device = config.pushbullet.devices;

	pusher.link(device, 'Watched Page Updated!', url);
}
