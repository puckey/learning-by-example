import path from 'path';
import { toLaxTitleCase as toTitleCase } from 'titlecase';

import Arena from './arena.js';
import JsonStore from './json-store';
import GoogleNews from './google-news';

const accessToken = process.argv[2];
const postsFile = process.argv[3] || 'posts.json';

const param = {
  query: 'What * can teach us about *',
  queryRegex: /^What (.+) can teach us about (.*)/i,
  channelId: 'learning-by-example',
  checkTitle: title => !/ and |&/i.test(title),
  createTitle: (title) => {
    const combo = title
      .match(param.queryRegex);
    return toTitleCase(`${combo[2]} Through ${combo[1]}`)
      .replace(/\([^)]+\)/g, '')
      .trim();
  }
};

if (!accessToken) {
  console.log('Please provide Are.na access token as argument');
  process.exit();
}

const store = new JsonStore(
  path.resolve(
    process.cwd(),
    postsFile
  ),
  { links: [], titles: [] }
);

const updateStore = (title, url) => {
  store.data.links.push(url);
  store.data.titles.push(title);
  store.persist();
}

const arena = new Arena({ accessToken });

new GoogleNews().track(
  param.query,
  async (error, data) => {
    if (error) return console.log('error', error);
    const { title, link } = data;
    if (
      !param.queryRegex.test(title)
      || !param.checkTitle(title)
      || store.data.links.indexOf(link) > -1
    ) return;
    const block = await (arena
      .block()
      .create(
        param.channelId,
        link,
      )
    );
    await arena
      .block(`${block.id}`)
      .update({ title: param.createTitle(title) });
    updateStore(title, link);
    console.log(`Added ${link}`);
  }
);

process.on('unhandledRejection', console.log);