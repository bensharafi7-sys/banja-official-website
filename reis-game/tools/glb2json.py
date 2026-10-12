"""Convert a .glb into a self-contained glTF .json (buffer embedded as a data URI) so static hosts that refuse .glb can serve it."""
import base64, json, struct, sys
src, dst = sys.argv[1], sys.argv[2]
b = open(src, 'rb').read()
assert b[:4] == b'glTF', 'not a GLB'
jl = struct.unpack('<I', b[12:16])[0]
j = json.loads(b[20:20 + jl])
o = 20 + jl
bl = struct.unpack('<I', b[o:o + 4])[0]
binc = b[o + 8:o + 8 + bl]
j['buffers'][0]['uri'] = 'data:application/octet-stream;base64,' + base64.b64encode(binc).decode()
json.dump(j, open(dst, 'w'), separators=(',', ':'))
print(dst, len(open(dst).read()))
