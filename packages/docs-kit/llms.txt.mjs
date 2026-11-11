import site from 'virtual:docs-kit/site';
import { docsSections, pageMarkdown, siteRoot } from './page.md.mjs';

/**
 * Serves llms.txt (https://llmstxt.org): an index linking every page's Markdown, and llms-full.txt: every page in one
 * file, for pasting a project's whole docs into a model's context.
 */
export function getStaticPaths() {
  return [{ params: { name: 'llms' } }, { params: { name: 'llms-full' } }];
}

export async function GET(context) {
  const sections = await docsSections();
  const root = siteRoot(context);
  const head = `# ${site.name}\n\n> ${site.tagline}`;

  if (context.params.name === 'llms-full') {
    const pages = sections.flatMap(({ pages }) => pages.map((page) => pageMarkdown(page, root)));
    return new Response([`${head}\n`, ...pages].join('\n'));
  }

  const links = sections.map(
    ({ label, pages }) =>
      `## ${label}\n\n` +
      pages
        .map(({ id, data }) => `- [${data.title}](${new URL(`${id}.md`, root)})${data.description ? `: ${data.description}` : ''}`)
        .join('\n'),
  );
  const intro = `Each page below links to its Markdown source. All pages in one file: ${new URL('llms-full.txt', root)}`;
  return new Response([head, intro, ...links].join('\n\n') + '\n');
}
