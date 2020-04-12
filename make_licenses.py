import os
import json
import shutil

with open('licenses.json', 'r') as fobj:
    licenses = json.load(fobj)

licenses.update(
    {
        "libpuz": {
            "repository": "https://github.com/ccasin/hpuz/tree/master/contrib/libpuz",
            "publisher": "Chris Casinghino and Josh Myer",
            "licenses": "GPL-2.0",
        },
        "textarea-line-numbers": {
            "repository": "https://github.com/MatheusAvellar/textarea-line-numbers",
            "publisher": "Matheus Avellar",
            "licenses": "Apache-2.0"
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


