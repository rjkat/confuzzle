import os
import json
import shutil

shutil.rmtree('licenses')
os.mkdir('licenses')

with open('licenses.json', 'r') as fobj:
    licenses = json.load(fobj)

licenses.update(
    {
        "prism-live": {
            "repository": "https://github.com/PrismJS/live",
            "publisher": "Lea Verou",
        }
    }
)

for (name, info) in licenses.items():
    d = os.path.join('licenses', name.replace('/', '-'))
    if not os.path.isdir(d):
        os.mkdir(d)
    if 'licenseFile' in info:
        f = info['licenseFile']
        shutil.copyfile(f, os.path.join(d, os.path.basename(f)))


with open(os.path.join('licenses', 'README.md'), mode='w', encoding='utf-8') as fobj:
    fobj.write('# Licenses\n')
    fobj.write('''This directory contains the license information of software dependencies.
Please contact `rjkat` at `ieee.org` if something is incorrect or missing.''')
    for name in sorted(licenses.keys()):
        fobj.write('\n\n## ' + name + '\n')
        for key, value in licenses[name].items():
            if key not in ['path', 'licenseFile']:
                if isinstance(value, list):
                    value = ', '.join(value)
                fobj.write('* ' + key + ': ' + value + '\n')


