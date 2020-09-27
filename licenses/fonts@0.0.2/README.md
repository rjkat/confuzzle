#fonts#

```
____ ____ ____ _       _    ____ ____ _  _ _ _  _ ____    ____ ____ _  _ ___ ____ 
|    |  | |  | |       |    |  | |  | |_/  | |\ | | __    |___ |  | |\ |  |  [__  
|___ |__| |__| |___    |___ |__| |__| | \_ | | \| |__]    |    |__| | \|  |  ___] 
____ ____ ____    ___ _  _ ____    ____ ____ _  _ ____ ____ _    ____   / 
|___ |  | |__/     |  |__| |___    |    |  | |\ | [__  |  | |    |___  /  
|    |__| |  \     |  |  | |___    |___ |__| | \| ___] |__| |___ |___ . 
```

**Instalation**  
```bash
npm install fonts
```
    
**Usage**
```JavaScript
var fonts = require("fonts");

fonts("Cool looking fonts").print();
fonts("for the console!").print();
fonts("--------------").print();
fonts("abcdefghijklmnoprqstuvxywz").print();
fonts("!?").print();
fonts("0123456789").print();
fonts("+ - _ , . : ;").print();
```
or say you want to use [cliff](https://github.com/flatiron/cliff) as you like things coloured

```JavaScript
var cliff = require("cliff"); 
var fonts = require("fonts");

var textArray = fonts("This is gonna be colorful!").raw(); //return an array with your text
console.log(textArray.join("\n").rainbow);

```

**Using your custom font**   
To implement your own custom font take a [look at this file](https://github.com/gammasoft/fonts/blob/master/defaultFont.js) and just follow its interface.
```JavaScript
var fonts = require("fonts");
var myCoolCustomFont = require("myCoolCustomFont");

fonts("My cool looking text!", myCoolCustomFont).print();
```

#### BSD License

Copyright (c) 2013, Gammasoft Desenvolvimento de Software Ltda  
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

- Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer. 
- Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution. 

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
