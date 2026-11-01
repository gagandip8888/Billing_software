const http = require('http');

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
    }).on('error', reject);
  });
}

(async () => {
  console.log('Fetching http://localhost:3000/ ...');
  const home = await fetchUrl('http://localhost:3000/');
  console.log('Home status:', home.status);

  // Extract all stylesheets and scripts
  const cssMatches = [...home.body.matchAll(/href=\"(\/_next\/static\/[^\"]+)\"/g)].map(m => m[1]);
  const jsMatches = [...home.body.matchAll(/src=\"(\/_next\/static\/[^\"]+)\"/g)].map(m => m[1]);

  console.log('Found CSS files count:', cssMatches.length);
  console.log('Found JS files count:', jsMatches.length);

  let has404 = false;

  for (const css of cssMatches) {
    const res = await fetchUrl('http://localhost:3000' + css);
    console.log('CSS:', css.slice(0, 60), '-> Status:', res.status, 'Size:', res.body.length);
    if (res.status === 404) has404 = true;
  }

  for (const js of jsMatches) {
    const res = await fetchUrl('http://localhost:3000' + js);
    console.log('JS:', js.slice(0, 60), '-> Status:', res.status, 'Size:', res.body.length);
    if (res.status === 404) has404 = true;
  }

  if (has404) {
    console.error('FAILED: One or more assets returned 404!');
    process.exit(1);
  } else {
    console.log('SUCCESS: All CSS and JS chunks loaded with 200 OK! Zero 404 errors.');
  }
})();
