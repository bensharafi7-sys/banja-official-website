# Concatenates src/ fragments into index.html (repo) and an artifact body (no doctype/html/head/body wrapper).
import pathlib, sys
root = pathlib.Path(__file__).parent
parts = sorted((root / 'src').glob('*'))
js = ''.join(p.read_text() for p in parts if p.suffix == '.js')
head = (root / 'src/00_head.html').read_text()
full = head + js + '\n</script>\n</body>\n</html>\n'
(root / 'index.html').write_text(full)
if len(sys.argv) > 1:
    out = pathlib.Path(sys.argv[1])
    pre = head[head.index('<title>'):head.index('</head>')]
    body = head[head.index('<body class="intro">') + len('<body class="intro">'):]
    out.write_text(pre + "<script>document.body.classList.add('intro')</script>\n" + body + js + '\n</script>\n')
print('built', len(full))
