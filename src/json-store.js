var fs = require('fs-extra');
var path = require('path');

class JsonStore {
  constructor(uri, initialData = {}) {
		this.uri = uri;
		if (fs.existsSync(this.uri)) {
			const json = fs.readFileSync(this.uri, 'utf8');
			this.data = json.length
				? JSON.parse(json)
				: {};
		} else {
			this.data = initialData;
		};
	}

	persist() {
		return fs.writeFile(
			this.uri,
			JSON.stringify(this.data)
		);
	}
};

module.exports = JsonStore;
