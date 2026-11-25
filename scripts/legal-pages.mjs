import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const documents = [
  { key: 'terms', page: 'terms-and-conditions.html', name: 'Terms & Conditions' },
  { key: 'privacy', page: 'privacy-policy.html', name: 'Privacy Policy' }
];
const escape = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const linkContacts = value => escape(value)
  .replaceAll('admin@anchorblock.vc', '<a href="mailto:admin@anchorblock.vc">admin@anchorblock.vc</a>')
  .replaceAll('+8801400655308', '<a href="tel:+8801400655308">+8801400655308</a>');

for (const document of documents) {
  const extracted = JSON.parse(await readFile(path.join(root, `docs/legal/${document.key}-extracted.json`), 'utf8'));
  // PDF running footers and the decorative spaced wordmark are not document clauses.
  const lines = extracted.pages.flatMap(page => page.lines.filter(line => !/^\d+ \/ \d+Onubot · /.test(line.text)))
    .filter(line => line.text !== 'O N U B OT');
  const firstSection = lines.findIndex(line => /^1\. /.test(line.text));
  const [title, company, date, ...contact] = lines.slice(0, firstSection);
  const sections = [];
  let section;
  let paragraph = '';
  let previous;
  const flush = () => {
    if (paragraph) section.content.push(`<p>${linkContacts(paragraph)}</p>`);
    paragraph = '';
  };
  for (const line of lines.slice(firstSection)) {
    if (line.size > 12) {
      if (section) flush();
      section = { title: line.text, id: line.text === 'References' ? 'references' : `section-${line.text.match(/^\d+/)[0]}`, content: [] };
      sections.push(section);
    } else if (line.size > 10.7) {
      flush();
      section.content.push(`<h3>${escape(line.text)}</h3>`);
    } else {
      if (section.id === 'references') flush();
      // Rejoin wrapped lines, including paragraphs split across PDF pages.
      const separator = paragraph && !paragraph.endsWith('-') ? ' ' : '';
      if (paragraph && previous.y > line.y && previous.y - line.y > 20) flush();
      paragraph += (paragraph ? separator : '') + line.text.trim();
    }
    previous = line;
  }
  flush();
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escape(document.name)} | Onubot</title>
  <meta name="description" content="Read the Onubot ${escape(document.name)}, last updated 24 November 2026. Contact Anchorblock Technology for support and privacy requests.">
  <meta name="theme-color" content="#f8fafc">
  <link rel="icon" href="assets/onubot-mark.png" type="image/png">
  <link rel="stylesheet" href="legal.css">
</head>
<body id="top">
  <a class="skip-link" href="#document">Skip to document</a>
  <header class="legal-header">
    <a class="legal-brand" href="index.html" aria-label="Onubot home"><img src="assets/onubot-mark.png" width="30" height="40" alt=""><span>Onubot</span></a>
    <nav aria-label="Legal pages">${documents.map(item => `<a href="${item.page}"${item.key === document.key ? ' aria-current="page"' : ''}>${escape(item.name)}</a>`).join('')}<a class="back-home" href="index.html">Back to home <span aria-hidden="true">↗</span></a></nav>
  </header>
  <main class="legal-layout">
    <aside class="legal-sidebar">
      <nav class="legal-toc" aria-label="Document contents">
        <details open><summary>On this page</summary><ol>${sections.map(item => `<li><a href="#${item.id}">${escape(item.title)}</a></li>`).join('')}</ol></details>
      </nav>
      <a class="legal-pdf" href="assets/legal/${extracted.filename}" download>Download original PDF <span aria-hidden="true">↓</span></a>
      <p class="legal-source">${extracted.pages.length}-page original · English</p>
    </aside>
    <article id="document" class="legal-document" data-legal-document>
      <header class="legal-document-header">
        <h1>${escape(title.text)}</h1>
        <p class="legal-company">${escape(company.text)}</p>
        <p class="legal-date">${escape(date.text)}</p>
        <div class="legal-contact">${contact.map(line => `<p>${linkContacts(line.text)}</p>`).join('')}</div>
      </header>
${sections.map(item => `      <section id="${item.id}"><h2>${escape(item.title)}</h2>\n${item.content.map(block => `        ${block}`).join('\n')}\n      </section>`).join('\n')}
    </article>
  </main>
  <footer class="legal-footer"><a href="index.html">← Back to Onubot</a><a href="#top">Back to top ↑</a></footer>
</body>
</html>
`;
  await writeFile(path.join(root, document.page), html);
  console.log(`${document.page}: ${sections.length - 1} numbered sections + references`);
}
