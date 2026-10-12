#!/bin/sh
# Pull the scanned, rigged characters from Higgsfield (needs d8j0ntlcm91z4.cloudfront.net allowed), then shrink and convert them.
set -e
cd "$(dirname "$0")/.."
U=https://d8j0ntlcm91z4.cloudfront.net/user_35zOfWnyqfEkHVtWMlbNBPKPHC0
for pair in benjo:hf_20261012_112511_a093bb27-0d4e-4369-8de2-bfd26883aeec selim:hf_20261012_162653_6e58fbb3-07a1-4192-aeee-bf83c0f70f21 \
            demir:hf_20261012_162655_8906e96f-a048-4832-8cb2-397643e4d7e8 thug:hf_20261012_162656_d667338c-336c-45e0-b1df-2e945a84e3bd; do
  name=${pair%%:*}; file=${pair#*:}
  curl -sf -o /tmp/$name.raw.glb "$U/$file.glb"
  python3 tools/shrink_scan.py /tmp/$name.raw.glb /tmp/$name.glb
  python3 tools/glb2json.py /tmp/$name.glb models/$name.json
done
