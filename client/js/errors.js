const { HtmlReporter, EnoError } = require('enolib');

export class ErrorDisplay {
    constructor(tab, text, snippet) {
        this.text = text;
        this.snippet = snippet;
    }

    showError(err) {
        // if (err instanceof EnoError) {
        //     this.text.textContent = err.text;
        //     this.snippet.textContent = err.snippet;
        // } else {
        //     this.text.textContent = 'Congratulations, you broke it! Please file a bug with a description of what you were doing and the following output.'
        //     this.snippet.textContent = err.stack + "\n"
        // }
    }

    clearError() {
        // this.text.textContent = 'No errors - you are awesome!';
        // this.snippet.textContent = '';
    }
}