function decorate(heading, permalink) {
  if (heading == null || permalink == null) {
    return;
  }
  const element = document.createElement('sup');
  element.dataset.generatedBy = chrome.runtime.id;
  const anchor = document.createElement('a');
  anchor.setAttribute('href', permalink.href);
  anchor.setAttribute('id', 'permalinks-awakening');
  anchor.setAttribute('rel', 'bookmark');
  anchor.setAttribute('title', permalink.type);
  anchor.appendChild(document.createTextNode('\u2766'));
  element.appendChild(anchor);
  heading.appendChild(element);
}

function filter(elements, keyAttribute, valueAttribute, keys, hint) {
  for (const element of elements) {
    if (keys.includes(toLowerCase(element.getAttribute(keyAttribute)))) {
      const permalink = normalizePermalink(element.getAttribute(valueAttribute), hint);
      if (permalink != null) {
        return permalink;
      }
    }
  }
}

function getPermalink(settings, metaElements) {
  if (settings.includePIDs) {
    const configs = [
      { hint: 'doi:', keys: [ 'bepress_citation_doi', 'citation_doi', 'dc.doi', 'dc.identifier.doi', 'doi', 'prism.doi' ] },
      { hint: 'arxiv:', keys: [ 'citation_arxiv_id' ] },
      { hint: 'pmid:', keys: [ 'citation_pmid', 'ncbi_article_id' ] },
      { hint: null, keys: [ 'dc.identifier' ] }
    ];
  	for (const config of configs) {
      const permalink = filter(metaElements, 'name', 'content', config.keys, config.hint);
      if (permalink != null) {
        return { href: permalink, type: 'Persistent identifier'};
      }
  	}
  }
  if (settings.includePermalinks) {
    if (document.body.classList.contains('mediawiki')) {
      const element = document.body.querySelector('#t-permalink a[href]');
      if (element != null) {
        const permalink = urlify(element.getAttribute('href'), true);
        if (permalink != null) {
          return { href: permalink, type: 'Permalink'};
        }
      }
    }
  }
  if (settings.includeCanonicalLinks) {
    const links = document.head.querySelectorAll('link[rel][href]');
    const relations = [ 'bookmark', 'canonical', 'cite-as' ];
    const permalink = filter(links, 'rel', 'href', relations, null);
    if (permalink != null) {
      return { href: permalink, type: 'Canonical link' };
    }
  }
}

function doify(value) {
  if (value == null) {
    return;
  }
  if (/^10.\S+\/\S+$/.test(value)) {
    return 'https://doi.org/' + value;
  }
}

function urlify(value, relativize) {
  if (value == null) {
    return;
  }
  try {
    return relativize ? new URL(value, document.documentURI) : new URL(value);
  } catch (error) {
    return;
  }
}

function normalize(string) {
  if (string == null) {
    return null;
  }
  string = string.normalize('NFC').replace(/\s+/, ' ').trim();
  return string.length == 0 ? null : string;
}

function normalizePermalink(value, hint) {
  if (value == null) {
    return;
  }
  const url = urlify(value, false);
  if (url != null && url.protocol != null) {
  	const schemeSpecificPart = url.href.substring(url.protocol.length);
    switch(url.protocol) {
      case 'arxiv:':
        return 'https://arxiv.org/abs/' + schemeSpecificPart;
      case 'doi:':
        return doify(schemeSpecificPart);
      case 'http:':
      case 'https:':
        return url.href;
      case 'pmid:':
        return 'https://pubmed.ncbi.nlm.nih.gov/' + schemeSpecificPart;
    }
  }
  if (hint != null) {
  	return normalizePermalink(hint + value);
  }
  return doify(value);
}

function toLowerCase(string) {
  return string == null ? null : string.toLowerCase();
}

function getHeading(metaElements) {
  const titles = new Set();
  titles.add(normalize(document.title));
  const titleAttributes = [ 'citation_title', 'dc.title', 'og:title', 'twitter:title' ];
  for (const metaElement of metaElements) {
    if (titleAttributes.includes(toLowerCase(metaElement.getAttribute('name')))) {
      titles.add(normalize(metaElement.getAttribute('content')));
    }
  }
  titles.delete(null);
  if(titles.size == 0) {
  	return;
  }
  const headingTags = [ 'h1', 'h2', 'h3', 'h4', 'h5', 'h6' ];
  const matchers = [
    function(heading, title) { return heading == title; } ,
    function(heading, title) { return title.startsWith(heading) || title.endsWith(heading); }
  ];
  for (const headingTag of headingTags) {
    const headings = document.body.querySelectorAll(headingTag);
    for (const matcher of matchers) {
      for (const heading of headings) {
        const headingText = normalize(heading.innerText);
        if (headingText == null) {
          continue;
        }
        for (const title of titles) {
          if (matcher(headingText, title)) {
            return heading;
          }
        }
      }
    }
  }
}

getSettings(function (settings) {
  const metaElements = document.head.querySelectorAll('meta[name][content]');
  const permalink = getPermalink(settings, metaElements);
  if (permalink != null) {
    decorate(getHeading(metaElements), permalink);
  }
});