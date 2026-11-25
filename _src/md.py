"""Versiunea Markdown a unei pagini (pentru asistenți AI, conform propunerii llms.txt).

Convertește conținutul din <main> al paginii generate: titluri, paragrafe, liste, tabele,
linkuri și imagini cu text alternativ. Elementele interactive (butoane, câmpuri, navigație,
conținut ascuns sau aria-hidden) nu intră în Markdown. Fără dependențe externe.
"""
from html.parser import HTMLParser
from urllib.parse import urljoin
import re

VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"}
SKIP = {"script", "style", "svg", "button", "select", "textarea", "input", "template", "dialog", "nav",
        "label", "noscript", "canvas", "iframe", "video", "audio", "form", "fieldset"}
# părți ale unui rând de preț / ale titlului de album, separate cu „ — ” în Markdown
DASH = {"pl-desc", "pl-price", "studio-tag"}
BLOCK = {"p", "div", "section", "article", "header", "footer", "figure", "figcaption", "details", "summary",
         "aside", "main", "blockquote", "fieldset", "dl", "dt", "dd", "address", "ul", "ol", "li", "table",
         "hr", "img", "h1", "h2", "h3", "h4", "h5", "h6"}


class Node:
    def __init__(self, tag, attrs, parent=None):
        self.tag, self.attrs, self.parent, self.children = tag, dict(attrs), parent, []


class Tree(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.root = self.cur = Node("root", [])

    def handle_starttag(self, tag, attrs):
        node = Node(tag, attrs, self.cur)
        self.cur.children.append(node)
        if tag not in VOID:
            self.cur = node

    def handle_startendtag(self, tag, attrs):
        self.cur.children.append(Node(tag, attrs, self.cur))

    def handle_endtag(self, tag):
        n = self.cur
        while n is not self.root and n.tag != tag:
            n = n.parent
        if n is not self.root:
            self.cur = n.parent

    def handle_data(self, data):
        self.cur.children.append(data)


def card_button(n):
    return n.tag == "button" and "aria-pressed" in n.attrs


def skipped(n):
    a = n.attrs
    if card_button(n):
        return "hidden" in a or a.get("aria-hidden") == "true"
    return (n.tag in SKIP or "hidden" in a or a.get("aria-hidden") == "true"
            or (n.tag == "a" and a.get("tabindex") == "-1"))


def has_block(n):
    return any(not isinstance(c, str) and not skipped(c) and (c.tag in BLOCK or card_button(c) or has_block(c)) for c in n.children)


def clean(s):
    return re.sub(r"[ \t\r\n ]+", " ", s).strip()


class Markdown:
    def __init__(self, page_url):
        self.page_url = page_url

    def url(self, href):
        if not href or href == "#" or href.startswith(("javascript:", "mailto:", "tel:")):
            return href if href and href.startswith(("mailto:", "tel:")) else None
        return urljoin(self.page_url, href)

    # ---------------------------------------------------------------- inline
    def inline(self, n):
        if isinstance(n, str):
            return n
        if skipped(n):
            return ""
        if n.tag == "br":
            return "\n"
        if n.tag == "img":
            return ""
        inner = "".join(self.inline(c) for c in n.children)
        if n.tag == "span" and set(n.attrs.get("class", "").split()) & DASH and clean(inner):
            return f" — {clean(inner)}"
        if n.tag == "span":  # spanurile sunt adesea afișate ca blocuri separate în CSS
            return f" {inner} "
        if n.tag in ("strong", "b") and clean(inner):
            return f"**{clean(inner)}**"
        if n.tag in ("em", "i") and clean(inner):
            return f"*{clean(inner)}*"
        if n.tag == "a":
            href, text = self.url(n.attrs.get("href")), clean(inner)
            if href and text:
                return f"[{text}]({href})"
        return inner

    def text(self, nodes):
        out = "".join(self.inline(c) for c in nodes)
        out = re.sub(r"\)\s*\[", ")\n[", out)  # linkuri alăturate (ex. butoane): câte unul pe rând
        lines = [clean(x) for x in out.split("\n")]
        return "  \n".join(x for x in lines if x)

    # ---------------------------------------------------------------- blocks
    def blocks(self, n):
        out, run = [], []

        def flush():
            t = self.text(run)
            if t:
                out.append(t)
            run.clear()

        for c in n.children:
            if isinstance(c, str):
                run.append(c)
                continue
            if skipped(c):
                continue
            if c.tag not in BLOCK and not card_button(c) and not has_block(c):
                run.append(c)
                continue
            flush()
            out += self.block(c)
        flush()
        return out

    def block(self, n):
        t = n.tag
        if t in ("h1", "h2", "h3", "h4", "h5", "h6"):
            text = self.text(n.children).replace("  \n", " ")
            return [f"{'#' * int(t[1])} {text}"] if text else []
        if t == "summary":
            text = self.text(n.children)
            return [f"### {text}"] if text else []
        if t == "img":
            alt, src = clean(n.attrs.get("alt", "")), self.url(n.attrs.get("src"))
            return [f"![{alt}]({src})"] if alt and src else []
        if t == "hr":
            return ["---"]
        if card_button(n):
            text = self.text(n.children)
            return [f"- {text}"] if text else []
        if t in ("ul", "ol"):
            items, i = [], 0
            for c in n.children:
                if isinstance(c, str) or skipped(c) or c.tag != "li":
                    continue
                body = self.blocks(c)
                if not body:
                    continue
                i += 1
                mark = f"{i}. " if t == "ol" else "- "
                lines = "\n\n".join(body).split("\n")
                pad = " " * len(mark)
                items.append(mark + lines[0] + "".join("\n" + (pad + x if x else "") for x in lines[1:]))
            return ["\n".join(items)] if items else []
        if t == "table":
            return self.table(n)
        if t == "dl":  # perechi termen / valoare (ex. specificațiile albumului)
            items, term = [], None
            stack = [c for c in n.children if not isinstance(c, str)]
            while stack:
                c = stack.pop(0)
                if skipped(c):
                    continue
                if c.tag == "dt":
                    term = self.text(c.children)
                elif c.tag == "dd":
                    value = self.text(c.children)
                    items.append(f"- **{term}:** {value}" if term else f"- {value}")
                else:  # <div> care grupează dt/dd
                    stack[:0] = [x for x in c.children if not isinstance(x, str)]
            return ["\n".join(items)] if items else []
        if t == "blockquote":
            return ["\n".join("> " + x for x in "\n\n".join(self.blocks(n)).split("\n"))]
        if t == "a":  # link care conține blocuri (carduri): conținutul, apoi linkul
            out = self.blocks(n)
            href = self.url(n.attrs.get("href"))
            if href and len(out) == 1 and "](" not in out[0]:
                return [f"[{clean(out[0].replace('  \n', ' '))}]({href})"]
            if href and out:
                out[-1] += f" ([detalii]({href}))"
            return out
        return self.blocks(n)

    def table(self, n):
        rows, notes = [], []

        def walk(x):
            for c in x.children:
                if isinstance(c, str) or skipped(c):
                    continue
                if c.tag == "tr":
                    cells = [d for d in c.children if not isinstance(d, str) and d.tag in ("td", "th")]
                    if len(cells) == 1 and cells[0].attrs.get("colspan"):
                        notes.append(self.text(cells[0].children))
                    else:
                        rows.append([self.text(d.children).replace("  \n", " ").replace("|", "\\|") for d in cells])
                else:
                    walk(c)
        walk(n)
        if not rows:
            return notes
        width = max(len(r) for r in rows)
        rows = [r + [""] * (width - len(r)) for r in rows]
        md = ["| " + " | ".join(rows[0]) + " |", "|" + "---|" * width] + ["| " + " | ".join(r) + " |" for r in rows[1:]]
        return ["\n".join(md)] + [x for x in notes if x]


def page_markdown(html, page_url, title, description, updated):
    """Markdown pentru o pagină: antet (titlu, descriere, sursă) + conținutul din <main>."""
    m = re.search(r'<main id="main">(.*)</main>', html, re.S)
    tree = Tree()
    tree.feed(m.group(1) if m else "")
    body = Markdown(page_url).blocks(tree.root)
    # primul <h1> devine titlul documentului; restul rămâne în ordine
    h1 = next((b for b in body if b.startswith("# ")), f"# {title}")
    body = [b for b in body if b is not h1]
    head = [h1, f"> {description}", f"Pagina: {page_url}  \nActualizat: {updated}"]
    text = "\n\n".join(head + body) + "\n"
    return re.sub(r"\n{3,}", "\n\n", text)
