# https://raw.githubusercontent.com/github/gemoji/master/db/emoji.json

import os
import json
import emoji

__dir__ = os.path.abspath(os.path.dirname(__file__))

with open('emoji.json') as fobj:
    emoji_dict = json.load(fobj)

d = {}
for x in emoji_dict:
    # don't allow emoji that aren't emojizable
    if emoji.emojize(emoji.demojize(x['emoji'])) != x['emoji']:
        continue
    aliases = []
    for a in x.get('aliases', []):
        aliases.extend(a.split('_'))
    tags = x.get('tags', [])
    desc = x.get('description', '').split(' ')
    for possible in [aliases, desc, tags]:
        sanitized = [x.lower() for x in possible]
        # if this word is specific to this emoji,
        # ignore all the other ones
        if len(sanitized) == 1:
            w = sanitized[0]
            d[w] = set([x['emoji']])
        else:
            for w in sanitized:
                if w not in d.keys():
                    d[w] = set()
                d[w].add(x['emoji'])

class SetEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, set):
            return list(obj)
        return json.JSONEncoder.default(self, obj)  


with open(os.path.join(__dir__, '..', 'client', 'js', 'words_to_emoji.js') 'w') as fobj:
    fobj.write('const EMOJI_DICT = ')
    json.dump(d, fobj, cls=SetEncoder)
    fobj.write(';\n')
    fobj.write('module.exports = {EMOJI_DICT: EMOJI_DICT};\n');

import pdb
pdb.set_trace()