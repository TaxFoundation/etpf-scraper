const axios = require('axios');
const cheerio = require('cheerio');


async function mapLinks(root, path, sitemap) {
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
      && !link.match(/.*etpf\.org.*/)
      && !link.match(path)
    ));

    // add new key and set links at path
    theSitemap.set(path, links);

    // filter out crawled internal links
    links = links.filter(link => (
      !theSitemap.has(link)
      && link.match(/\.html$/)
    ));

    console.log(`${url} has ${links.length} uncrawled links.`);

    links.forEach(async link => {
      const updatedSitemap = await mapLinks(root, link, theSitemap);
      theSitemap = new Map([...theSitemap, ...updatedSitemap])
    });

    return theSitemap;
  } catch (error) {
    console.error(error);
  }
}

async function scrape() {
  const sitemap = await mapLinks('https://etpf.org', 'index.html', new Map());
  console.log(sitemap);
}

scrape();