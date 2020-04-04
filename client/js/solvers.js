export class SolverDisplay {
    constructor(container) {
        this.container = container;
    }

    show() {
        this.container.classList.remove('hidden');
    }

    solversChanged(solvers) {
        this.container.innerHTML = ''
        const list = document.createElement('ul');
        const self = this;

        const items = []
        for (let [solverid, props] of Object.entries(solvers)) {
            const li = document.createElement('li');
            li.classList.add('solver');
            li.dataset.solverMask = 1 << props.solverid;
            li.textContent = props.name;
            items.push(li);
        }
        items.sort((a, b) => a.dataset.solverid < b.dataset.solverid);
        items.forEach(li => list.appendChild(li));
        this.container.appendChild(list);
    }
}