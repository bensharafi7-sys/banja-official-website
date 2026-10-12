"""Shrink a Meshy rigged scan: drop tangents, baked emissive and the 1-frame clip; textures to 1024/512 JPEG."""
import io, json, struct, sys
from PIL import Image
src, dst = sys.argv[1], sys.argv[2]
b = open(src, 'rb').read(); l = struct.unpack('<I', b[12:16])[0]; j = json.loads(b[20:20 + l]); bin0 = b[20 + l + 8:]
def view(i):
    bv = j['bufferViews'][i]; o = bv.get('byteOffset', 0); return bin0[o:o + bv['byteLength']]
out = bytearray(); views = []
def add(data, target=None):
    while len(out) % 4: out.append(0)
    v = {'buffer': 0, 'byteOffset': len(out), 'byteLength': len(data)}
    if target: v['target'] = target
    out.extend(data); views.append(v); return len(views) - 1
acc = j['accessors']; prim = j['meshes'][0]['primitives'][0]; newacc = []
def addacc(a, target):
    d = view(a['bufferView'])[a.get('byteOffset', 0):]
    na = dict(a); na['bufferView'] = add(bytes(d), target); na['byteOffset'] = 0; newacc.append(na); return len(newacc) - 1
attrs = {n: addacc(acc[prim['attributes'][n]], 34962) for n in ['POSITION', 'NORMAL', 'TEXCOORD_0', 'JOINTS_0', 'WEIGHTS_0']}
idx = addacc(acc[prim['indices']], 34963); ibm = addacc(acc[j['skins'][0]['inverseBindMatrices']], None)
m = j['materials'][0]; pbr = m['pbrMetallicRoughness']
src_tex = lambda t: j['textures'][t['index']]['source']
plan = [(src_tex(pbr['baseColorTexture']), 1024, 86), (src_tex(m['normalTexture']), 1024, 90), (src_tex(pbr['metallicRoughnessTexture']), 512, 86)]
imgs = []
for s, sz, q in plan:
    im = Image.open(io.BytesIO(view(j['images'][s]['bufferView']))).convert('RGB').resize((sz, sz), Image.LANCZOS)
    bio = io.BytesIO(); im.save(bio, 'JPEG', quality=q); imgs.append({'bufferView': add(bio.getvalue()), 'mimeType': 'image/jpeg'})
nj = {'asset': j['asset'], 'scene': j.get('scene', 0), 'scenes': j['scenes'], 'nodes': j['nodes'],
      'meshes': [{'primitives': [{'attributes': attrs, 'indices': idx, 'material': 0}]}], 'skins': [dict(j['skins'][0], inverseBindMatrices=ibm)],
      'accessors': newacc, 'bufferViews': views, 'buffers': [{'byteLength': len(out)}], 'images': imgs,
      'textures': [{'sampler': 0, 'source': i} for i in range(3)], 'samplers': j['samplers'],
      'materials': [{'normalTexture': {'index': 1}, 'pbrMetallicRoughness': {'baseColorTexture': {'index': 0}, 'metallicRoughnessTexture': {'index': 2}}}]}
js = json.dumps(nj, separators=(',', ':')).encode()
while len(js) % 4: js += b' '
while len(out) % 4: out.append(0)
open(dst, 'wb').write(struct.pack('<III', 0x46546C67, 2, 28 + len(js) + len(out)) + struct.pack('<II', len(js), 0x4E4F534A) + js + struct.pack('<II', len(out), 0x004E4942) + bytes(out))
