const axios = require('axios');
const cheerio = require('cheerio');

const root = 'https://etpf.org'
let sitemap = {};
let pages = 0;

async function getHTML(url) {
  const { data } = await axios.get(url);
  return cheerio.load(data);
}

async function getLinks(url) {
  const $ = await getHTML(url);
  if (!sitemap[url]) sitemap[url] = [];

  const links = $('a').map((i, el) => {
    return $(el).attr('href');
  }).get().map(link => root + '/' + link);

  if (!sitemap[url].length) sitemap[url] = links;

  links.forEach(link => {
    if (!sitemap[link]) sitemap[link] = [];
    if (link.match(/\.html$/) && sitemap[link].length <= 0) {
      getLinks(link);
    }
  });

  pages += 1;
  console.log(pages);
}

function scrape() {
  getLinks(root);
  console.log(sitemap);
}

scrape();