const request = require('request');
const FeedParser = require('feedparser');

export default class GoogleNews {
  constructor(options, params) {
    this.options = Object.assign({}, {
      pollInterval: 1000 * 60 * 15,
      params: Object.assign({},
        {
          cf: 'all',
          hl: 'en',
          lang: 'en',
          output: 'atom'
        },
        params
      )
    }, options);
    this.tracking = {};
  }

  track(query, callback) {
    return this.tracking[query] = new GoogleNewsTracker(this, query, callback);
  }

  untrack(query) {
    const tracker = this.tracking[query];
    if (!tracker) return;
    tracker.destroy();
  }
}

class GoogleNewsTracker {
  constructor(context, query, callback) {
    this.context = context;
    this.query = query;
    this.callback = callback;
    this.cache = {};
    this.poll();
    this.connect();
  }

  poll() {
    const feedParser = new FeedParser();
    feedParser.on('readable', () => {
      let item;
      while ((item = feedParser.read())) {
        if (!this.cache[item.guid]) {
          this.callback(null, item);
          this.cache[item.guid] = true;
        }
      }
    });
    feedParser.on('error', this.callback);
    request({
      qs: params,
      uri: `https://news.google.com/news/rss/search/section/q/${this.query}`
    }).pipe(feedParser);
  }

  destroy() {
    tracker.disconnect();
    tracker.callback = null;
    this.context.tracking[this.query] = null;
  }

  connect() {
    if (this.pollIntervalId) return;
    this.pollIntervalId = setInterval(this.poll, this.context.options.pollInterval);
  }

  disconnect() {
    clearInterval(this.pollIntervalId);
    this.pollIntervalId = null;
  }
}
