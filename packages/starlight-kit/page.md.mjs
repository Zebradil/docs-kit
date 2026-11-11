import { getCollection } from 'astro:content';

const sections = ['Getting started', 'Guides', 'Concepts', 'Reference'];

/** Published docs pages in sidebar order, grouped under the sidebar's section labels. */
export async function docsSections() {
  const pages = (await getCollection('docs', ({ data }) => !data.draft)).sort(
    (a, b) => (a.data.sidebar?.order ?? Infinity) - (b.data.sidebar?.order ?? Infinity) || a.id.localeCompare(b.id),
  );
  const section = ({ id }) => (id.includes('/') ? id.split('/')[0] : 'getting started');
  return sections
    .map((label) => ({ label, pages: pages.filter((page) => section(page) === label.toLowerCase()) }))
    .filter(({ pages }) => pages.length);
}

/** The site's root URL, base path included, with a trailing slash. */
export const siteRoot = ({ site }) => new URL(import.meta.env.BASE_URL.replace(/\/?$/, '/'), site);

// Inline `](target)` and reference-style `[label]: target` link destinations.
// shortcut: also matches look-alikes inside code blocks; parse with remark if a page trips on it.
const linkTarget = /(\]\(|^ {0,3}\[[^\]]+\]:[ \t]*)([^)\s]+)/gm;

/**
 * A page as Markdown: its title and description from frontmatter, then the source body. Relative links are written
 * against the page's HTML URL (/guides/x/), so they are made absolute to stay valid at /guides/x.md and in llms-full.txt.
 */
export function pageMarkdown({ id, data: { title, description }, body = '' }, root) {
  const page = new URL(`${id}/`, root);
  const absolute = body.trim().replace(linkTarget, (_, prefix, target) => prefix + new URL(target, page));
  return [`# ${title}`, description && `> ${description}`, absolute].filter(Boolean).join('\n\n') + '\n';
}

/** Serves each docs page's Markdown at its URL with `.md` appended, for agents that read docs. */
export async function getStaticPaths() {
  return (await docsSections()).flatMap(({ pages }) => pages.map((entry) => ({ params: { slug: entry.id }, props: { entry } })));
}

export function GET(context) {
  return new Response(pageMarkdown(context.props.entry, siteRoot(context)), {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
}
