import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import starlight from '@astrojs/starlight';
import { defineConfig } from 'astro/config';
import { parse } from 'yaml';
import { validateSite } from '../../schema/validate.mjs';

const kitPath = (path) => fileURLToPath(new URL(path, import.meta.url));

/** Builds the whole Astro config of a consuming project from its site.yaml (path relative to the working directory). */
export default function docsKit({ site: sitePath = 'site.yaml' } = {}) {
  const site = parse(readFileSync(sitePath, 'utf8'));
  const errors = validateSite(site);
  if (errors.length) throw new Error(`${sitePath} is invalid:\n  ${errors.join('\n  ')}`);

  // Hosting is GitHub Pages per repo: https://github.com/<owner>/<repo> is served at https://<owner>.github.io/<repo>,
  // or at the root of its custom domain.
  const [owner, repo] = new URL(site.repo).pathname.split('/').filter(Boolean);
  const base = site.domain ? '' : `/${repo}`;

  // Starlight links public/favicon.svg itself; these are linked only when the project ships them.
  const icons = [
    ['favicon.ico', { rel: 'icon', sizes: '32x32' }],
    ['apple-touch-icon.png', { rel: 'apple-touch-icon' }],
  ]
    .filter(([file]) => existsSync(`public/${file}`))
    .map(([file, attrs]) => ({ tag: 'link', attrs: { ...attrs, href: `${base}/${file}` } }));

  return defineConfig({
    site: site.domain ? `https://${site.domain}` : `https://${owner.toLowerCase()}.github.io`,
    base: base || '/',
    vite: { plugins: [siteModule(site)] },
    integrations: [
      starlight({
        title: site.name,
        description: site.tagline,
        logo: site.logo && (site.logo.dark ? { light: site.logo.light, dark: site.logo.dark } : { src: site.logo.light }),
        head: [
          ...icons,
          ...(site.analytics
            ? [{ tag: 'script', attrs: { src: site.analytics.script, defer: true, ...site.analytics.attributes } }]
            : []),
        ],
        social: [{ icon: 'github', label: 'GitHub', href: site.repo }],
        editLink: { baseUrl: `${site.repo}/edit/main/docs/` },
        customCss: [kitPath('layout.css'), kitPath(`themes/${site.theme ?? 'default'}.css`)],
        sidebar: [
          { label: 'Getting started', slug: 'getting-started' },
          ...['Guides', 'Concepts', 'Reference'].map((label) => ({
            label,
            items: [{ autogenerate: { directory: label.toLowerCase() } }],
          })),
        ],
      }),
      {
        name: 'docs-kit',
        hooks: {
          'astro:config:setup': ({ injectRoute }) => injectRoute({ pattern: '/', entrypoint: kitPath('Landing.astro') }),
        },
      },
    ],
  });
}

/** Exposes the validated site.yaml to Landing.astro as `virtual:docs-kit/site`. */
function siteModule(site) {
  const id = 'virtual:docs-kit/site';
  return {
    name: 'docs-kit-site',
    resolveId: (source) => (source === id ? `\0${id}` : undefined),
    load: (resolved) => (resolved === `\0${id}` ? `export default ${JSON.stringify(site)};` : undefined),
  };
}
