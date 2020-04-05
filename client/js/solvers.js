export class SolverDisplay {
    constructor(container, grid) {
        this.container = container;
        this.grid = grid;
        this.solverids = new Set([]);
    }

    show() {
        this.container.classList.remove('hidden');
    }

    solversChanged(solvers) {
        this.container.innerHTML = ''
        const list = document.createElement('ul');
        const items = []
        const newids = new Set([]);
        for (let [k, props] of Object.entries(solvers)) {
            newids.add(props.solverid);
            if (this.solverids.has(props.solverid)) {
                this.solverids.delete(props.solverid);
            }
            const li = document.createElement('li');
            li.classList.add('solver');
            li.dataset.solverMask = 1 << props.solverid;
            li.textContent = props.name;
            items.push(li);
        }
        items.sort((a, b) => a.dataset.solverid < b.dataset.solverid);
        items.forEach(li => list.appendChild(li));
        this.container.appendChild(list);

        // this.solverids now contains all the solvers who have left the game
        const self = this;
        this.solverids.forEach(solverid => self.grid.clearAllClues(solverid));
        this.solverids = newids;
    }
}