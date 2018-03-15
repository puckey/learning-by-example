const path = require('path');
const GoogleNews = require('google-news');
const Arena = require('./lib/arena.js');
const JsonStore = require('./lib/json-store');
const toTitleCase = require('titlecase').toLaxTitleCase;

const googleNews = new GoogleNews();
const accessToken = process.argv[2];

if (!accessToken) {
  console.log('Please provide Are.na access token as argument');
  process.exit();
}

const store = new JsonStore(
  path.resolve(
    __dirname,
    'posts.json'
  ),
  { links: [], titles: [] }
);

if (!accessToken) {
  console.log('Please provide Are.na access token as an argument');
  process.exit();
}

const createTitle = (title) => {
  const combo = title
    .match(/What (.+) can teach us about (.*) \-.+/i)
    .map(match => match.replace(/ - .+$/, ''));
  return toTitleCase(`${combo[1]} & ${combo[2]}`)
    .replace(/\([^)]+\)/g, '')
    .trim();
}

const updateStore = (title, url) => {
  store.data.links.push(url);
  store.data.titles.push(title);
  store.persist();
}

const arena = new Arena({ accessToken });

googleNews.stream(
  'What * can teach us about *',
  (stream) => {
    stream.on(GoogleNews.DATA, async (data) => {
      const url = data.link
        .match(/\&url\=(.+)$/)[1];
      if (/ and |&/i.test(data.title)) return;
      if (store.data.links.indexOf(url) > -1) return;
      const block = await (arena
        .block()
        .create(
          'learning-by-example',
          url,
        )
      );
      const title = createTitle(data.title);
      await arena
        .block(`${block.id}`)
        .update({ title });
      updateStore(title, url);
      console.log(`Added ${url}`);
    });
    stream.on(GoogleNews.ERROR, console.log);
  }
);

process.on('unhandledRejection', console.log);