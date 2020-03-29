const enolib = require('enolib');

export function parse(input, options) {
  const eno = enolib.parse(input, options);
  const xword = {};
  xword.name = eno.requiredField('name').requiredStringValue();
  xword.author = eno.requiredField('author').requiredStringValue();
  xword.pubdate = eno.requiredField('pubdate').requiredStringValue();
  xword.copyright = eno.requiredField('copyright').requiredStringValue();
  xword.size = eno.requiredField('size').requiredStringValue();
  xword.across = eno.requiredList('across').requiredStringValues();
  xword.down = eno.requiredList('down').requiredStringValues();

  return xword;
};