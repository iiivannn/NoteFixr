export function htmlToMarkdown(html: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  return walkNode(doc.body).trim();
}

export function htmlToPlainText(html: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  return walkNodePlain(doc.body).trim();
}

function walkNodePlain(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent ?? "";
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return "";

  const el = node as HTMLElement;
  const tag = el.tagName;
  const children = () => Array.from(el.childNodes).map(walkNodePlain).join("");

  switch (tag) {
    case "H1":
    case "H2":
    case "H3":
    case "H4":
    case "H5":
    case "H6":
      return `${children().toUpperCase()}\n\n`;

    case "STRONG":
    case "B":
    case "EM":
    case "I":
    case "S":
    case "U":
    case "MARK":
      return children();

    case "PRE": {
      const content = el.textContent ?? "";
      return `---\n${content}\n---\n\n`;
    }

    case "CODE":
      return el.textContent ?? "";

    case "BLOCKQUOTE": {
      const inner = children()
        .trim()
        .split("\n")
        .map((l) => `| ${l}`)
        .join("\n");
      return `${inner}\n\n`;
    }

    case "UL":
      return walkListPlain(el, false) + "\n\n";

    case "OL":
      return walkListPlain(el, true) + "\n\n";

    case "LI": {
      const checkbox = el.querySelector('input[type="checkbox"]');
      if (checkbox) {
        const checked = (checkbox as HTMLInputElement).checked;
        const text = Array.from(el.childNodes)
          .filter(
            (n) =>
              !(
                n.nodeType === Node.ELEMENT_NODE &&
                (n as HTMLElement).tagName === "INPUT"
              ),
          )
          .map(walkNodePlain)
          .join("")
          .trim();
        return `[${checked ? "x" : " "}] ${text}`;
      }
      return children().trim();
    }

    case "P": {
      const content = children();
      if (!content.trim()) return "";
      const next = el.nextElementSibling?.tagName;
      const nextIsList = next === "UL" || next === "OL";
      return `${content}${nextIsList ? "\n" : "\n\n"}`;
    }

    case "BR":
      return "\n";

    case "HR":
      return "---\n\n";

    case "A":
      return children();

    default:
      return children();
  }
}

function walkListPlain(el: HTMLElement, ordered: boolean): string {
  const items = Array.from(el.children).filter((c) => c.tagName === "LI");
  return items
    .map((item, i) => {
      const li = item as HTMLElement;
      if (li.querySelector('input[type="checkbox"]')) {
        return walkNodePlain(li).trim();
      }
      const prefix = ordered ? `${i + 1}. ` : "• ";
      return `${prefix}${walkNodePlain(li).trim()}`;
    })
    .join("\n");
}

function walkNode(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent ?? "";
  }

  if (node.nodeType !== Node.ELEMENT_NODE) return "";

  const el = node as HTMLElement;
  const tag = el.tagName;
  const children = () => Array.from(el.childNodes).map(walkNode).join("");

  switch (tag) {
    case "H1":
      return `# ${children()}\n\n`;
    case "H2":
      return `## ${children()}\n\n`;
    case "H3":
      return `### ${children()}\n\n`;
    case "H4":
      return `#### ${children()}\n\n`;
    case "H5":
      return `##### ${children()}\n\n`;
    case "H6":
      return `###### ${children()}\n\n`;

    case "STRONG":
    case "B":
      return `**${children()}**`;

    case "EM":
    case "I":
      return `*${children()}*`;

    case "S":
      return `~~${children()}~~`;

    case "U":
      return `<u>${children()}</u>`;

    case "MARK":
      return `==${children()}==`;

    case "PRE": {
      const codeEl = el.querySelector("code");
      const lang = codeEl?.className.replace("language-", "") ?? "";
      const content = codeEl?.textContent ?? el.textContent ?? "";
      return `\`\`\`${lang}\n${content}\n\`\`\`\n\n`;
    }

    case "CODE":
      return `\`${el.textContent}\``;

    case "BLOCKQUOTE": {
      const inner = children()
        .trim()
        .split("\n")
        .map((l) => `> ${l}`)
        .join("\n");
      return `${inner}\n\n`;
    }

    case "UL":
      return walkList(el, false) + "\n\n";

    case "OL":
      return walkList(el, true) + "\n\n";

    case "LI": {
      const checkbox = el.querySelector('input[type="checkbox"]');
      if (checkbox) {
        const checked = (checkbox as HTMLInputElement).checked;
        const text = Array.from(el.childNodes)
          .filter(
            (n) =>
              !(
                n.nodeType === Node.ELEMENT_NODE &&
                (n as HTMLElement).tagName === "INPUT"
              ),
          )
          .map(walkNode)
          .join("")
          .trim();
        return `- [${checked ? "x" : " "}] ${text}`;
      }
      return children().trim();
    }

    case "P": {
      const content = children();
      if (!content.trim()) return "";
      const next = el.nextElementSibling?.tagName;
      const nextIsList = next === "UL" || next === "OL";
      return `${content}${nextIsList ? "\n" : "\n\n"}`;
    }

    case "BR":
      return "\n";

    case "HR":
      return "---\n\n";

    case "A": {
      const href = el.getAttribute("href") ?? "";
      return `[${children()}](${href})`;
    }

    default:
      return children();
  }
}

function walkList(el: HTMLElement, ordered: boolean): string {
  const items = Array.from(el.children).filter((c) => c.tagName === "LI");
  return items
    .map((item, i) => {
      const li = item as HTMLElement;
      if (li.querySelector('input[type="checkbox"]')) {
        return walkNode(li).trim();
      }
      const prefix = ordered ? `${i + 1}. ` : "- ";
      return `${prefix}${walkNode(li).trim()}`;
    })
    .join("\n");
}
