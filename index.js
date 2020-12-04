const axios = require('axios');
const cheerio = require('cheerio');


async function mapLinks(root, path, sitemap) {
  if (sitemap.has(path)) {
    return sitemap;
  }

  try {
    let theSitemap = sitemap;
    const url = `${root}/${path}`;
    console.log(`Checking ${url}...`)

    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    let links = [...new Set($('a').map((i, el) => $(el).attr('href')).get())];

    // remove external links and dedupe
    links = links.filter(link => (
      link.match(/^(?!http|mailto).*/)
      && !link.match(path)
    ));

    // add new key and set links at path
    theSitemap.set(path, links);

    // filter out crawled internal links
    links = links.filter(link => (
      !theSitemap.has(link)
      && link.match(/\.html$/)
    ));

    if (links.length) {
      console.log(`${url} has ${links.length} uncrawled links.`);

      for (let i = 0, j = links.length; i < j; i++) {
        const updatedSitemap = await mapLinks(root, links[i], theSitemap);
        theSitemap = new Map([...theSitemap, ...updatedSitemap])
      }
    }

    return theSitemap;
  } catch (error) {
    console.error(error);
  }
}

function scrape() {
  mapLinks('https://etpf.org', 'index.html', new Map())
    .then(sitemap => console.log(sitemap))
    .catch(err => console.error(err))
}

scrape();