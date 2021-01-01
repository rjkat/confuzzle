import os
import sys
import puz
import json
import collections

__dir__ = os.path.abspath(os.path.dirname(__file__))

def get_words(puz_file):
    try:
        p = puz.read(puz_file)
        return [word for clue in p.clues for word in clue.split(' ')
                if word.isalnum() and len(word) > 2]
    except:
        return []

in_dir = sys.argv[1]
puz_files = [os.path.join(in_dir, f) for f in os.listdir(in_dir) if f.endswith('.puz')]

all_words = [w for p in puz_files for w in get_words(p)]

count = collections.Counter(all_words)

codebook = {x[0]: i + 1 for (i, x) in enumerate(count.most_common(255))}
lookup = {i: x for (x, i) in codebook.items()}

with open(os.path.join(__dir__, '..', 'client', 'js', 'codebook.js'), 'w') as fobj:
    fobj.write('const CLUE_CODEBOOK = {\n')
    fobj.write('   encode: ')
    json.dump(codebook, fobj)
    fobj.write(',\n')
    fobj.write('   decode: ')
    json.dump([None] + [lookup[i + 1] for i in range(len(lookup))], fobj)
    fobj.write('\n}\n')
    fobj.write('module.exports = {CLUE_CODEBOOK: CLUE_CODEBOOK};\n');

import pdb
pdb.set_trace()
