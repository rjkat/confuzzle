export class SolverDisplay {
    constructor(container) {
        this.container = container;
    }

    show() {
        this.container.classList.remove('hidden');
    }
}