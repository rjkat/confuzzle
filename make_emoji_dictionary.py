# https://raw.githubusercontent.com/github/gemoji/master/db/emoji.json

import json
import emoji

with open('emoji.json') as fobj:
    emoji_dict = json.load(fobj)

d = {}
for x in emoji_dict:
    if emoji.emojize(emoji.demojize(x['emoji'])) != x['emoji']:
        continue
    words = set()
    lc = lambda x: x.lower()
    words.update(set(map(lc, x.get('tags', []))))
    for a in x.get('aliases', []):
        words.update(set(map(lc, a.split('_'))))
    words.update(set(map(lc, x.get('description', '').split(' '))))
    for w in words:
        if w not in d.keys():
            d[w] = set()
        d[w].add(x['emoji'])

class SetEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, set):
            return list(obj)
        return json.JSONEncoder.default(self, obj)  


with open('client/js/words_to_emoji.js', 'w') as fobj:
    fobj.write('const EMOJI_DICT = ')
    json.dump(d, fobj, cls=SetEncoder)
    fobj.write(';\n')
    fobj.write('module.exports = {EMOJI_DICT: EMOJI_DICT};\n');

import pdb
pdb.set_trace()