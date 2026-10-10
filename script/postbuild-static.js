// Adds the files that server/server.js used to serve, so dist/ can be hosted
// statically (GitHub Pages).
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const dist = path.join(root, 'dist');
const pub = path.join(root, 'server', 'public');

// workbox copyLibraries writes to a versioned dir (workbox-vX.Y.Z); give it a
// stable name so client/service-worker.js doesn't depend on the installed version
for (const dir of fs.readdirSync(dist)) {
    if (/^workbox-v[\d.]+$/.test(dir)) {
        fs.rmSync(path.join(dist, 'workbox'), {recursive: true, force: true});
        fs.renameSync(path.join(dist, dir), path.join(dist, 'workbox'));
    }
}

// GitHub Pages serves 404.html for unknown paths, so client-side routes
// such as /anagram still load the app
fs.copyFileSync(path.join(dist, 'index.html'), path.join(dist, '404.html'));

fs.writeFileSync(path.join(dist, 'CNAME'), 'confuzzle.app\n');

// stop jekyll from dropping .well-known
fs.writeFileSync(path.join(dist, '.nojekyll'), '');

fs.mkdirSync(path.join(dist, '.well-known'), {recursive: true});
fs.copyFileSync(
    path.join(pub, '.well-known', 'apple-app-site-association'),
    path.join(dist, '.well-known', 'apple-app-site-association')
);

fs.copyFileSync(path.join(pub, 'images', 'favicon.ico'), path.join(dist, 'favicon.ico'));

fs.writeFileSync(path.join(dist, 'robots.txt'), 'User-agent: *\nAllow: /$\nAllow: /syntax$\nDisallow: /\n');
