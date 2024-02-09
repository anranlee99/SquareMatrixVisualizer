import p5 from 'p5';

interface Entry {
    col: number,
    data: number,
}

class SparseMatrix {
    size: number;
    matrix: Array<Array<Entry>>;
    NNZ: number = 0;
    constructor(n: number) {
        this.size = n;
        this.matrix = new Array(n);
        for (let i = 0; i < n; i++) {
            this.matrix[i] = new Array();
        }
    }
    equals(other: SparseMatrix): boolean {
        if (this.size !== other.size) {
            return false;
        }
        for (let i = 0; i < this.size; i++) {
            if (this.matrix[i].length !== other.matrix[i].length) {
                return false;
            }
            for (let j = 0; j < this.matrix[i].length; j++) {
                if (this.matrix[i][j].col !== other.matrix[i][j].col || this.matrix[i][j].data !== other.matrix[i][j].data) {
                    return false;
                }
            }
        }
        return true;
    }
    changeEntry(row: number, col: number, data: number) {
        if (row > this.size || col > this.size) {
            throw new Error("Index out of bounds");
        }
        for (let i = 0; i < this.matrix[row].length; i++) {
            if (this.matrix[row][i].col === col) {
                if (data === 0) {
                    this.matrix[row].splice(i, 1);
                    this.NNZ--;
                } else {
                    this.matrix[row][i].data = data;
                    return;
                }
            }
        }
        if (data !== 0) {
            this.matrix[row].push({ col, data });
            this.NNZ++;
        }
        this.matrix[row].sort((a, b) => a.col - b.col);

    }

    transpose() {
        let newMatrix = new SparseMatrix(this.size);
        for (let i = 0; i < this.size; i++) {
            for (let entry of this.matrix[i]) {
                newMatrix.changeEntry(entry.col, i, entry.data);
            }
        }
        return newMatrix;
    }
    scalarMult(x: number) {
        let newMatrix = new SparseMatrix(this.size);
        for (let i = 0; i < this.size; i++) {
            for (let entry of this.matrix[i]) {
                newMatrix.changeEntry(i, entry.col, entry.data * x);
            }
        }
        return newMatrix;
    }
    add(other: SparseMatrix) {
        if (this.size !== other.size) {
            throw new Error("Matrices are not the same size");
        }
        let newMatrix = new SparseMatrix(this.size);
        for (let i = 0; i < this.size; i++) {
            for (let entry of this.matrix[i]) {
                newMatrix.changeEntry(i, entry.col, entry.data);
            }
        }
        for (let i = 0; i < other.size; i++) {
            for (let entry of other.matrix[i]) {
                newMatrix.changeEntry(i, entry.col, entry.data + (newMatrix.matrix[i].find((x) => x.col === entry.col)?.data ?? 0));
            }
        }
        return newMatrix;
    }
    diff(other: SparseMatrix) {
        if (this.size !== other.size) {
            throw new Error("Matrices are not the same size");
        }
        let newMatrix = new SparseMatrix(this.size);
        for (let i = 0; i < this.size; i++) {
            for (let entry of this.matrix[i]) {
                newMatrix.changeEntry(i, entry.col, entry.data);
            }
        }
        for (let i = 0; i < other.size; i++) {
            for (let entry of other.matrix[i]) {
                newMatrix.changeEntry(i, entry.col, (newMatrix.matrix[i].find((x) => x.col === entry.col)?.data ?? 0) - entry.data);
            }
        }
        return newMatrix;
    }
    mult(other: SparseMatrix) {
        if (this.size !== other.size) {
            throw new Error("Matrices are not the same size");
        }
        let newMatrix = new SparseMatrix(this.size);
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                let sum = 0;
                for (let k = 0; k < this.size; k++) {
                    sum += (this.matrix[i].find((x) => x.col === k)?.data ?? 0) * (other.matrix[k].find((x) => x.col === j)?.data ?? 0);
                }
                if (sum !== 0) {
                    newMatrix.changeEntry(i, j, sum);
                }
            }
        }
        return newMatrix;
    }

    printMatrix() {
        let result = "";
        for (let i = 0; i < this.size; i++) {
            result += `${i + 1}: &nbsp;`
            for (const entry of this.matrix[i]) {
                result += `(${entry.col + 1}, ${entry.data.toFixed(1)}) &nbsp;`;
            }
            result += "<br>";
        }
        return result;
    }
};
new p5((p: p5) => {
    let x = 200;
    let y = 200;
    const width = Math.min(window.innerWidth, 1920);
    const height = Math.min(window.innerHeight, 1080);
    // Create input fields for row, column, and data
    let rowInput = p.createInput();
    rowInput.position(10, height + 30);
    rowInput.attribute('placeholder', 'Row');

    let colInput = p.createInput();
    colInput.position(10, height + 60);
    colInput.attribute('placeholder', 'Column');

    let dataInput = p.createInput();
    dataInput.position(10, height + 90);
    dataInput.attribute('placeholder', 'Data');

    // Create a button for changing entries
    let changeEntryBtn = p.createButton('Change Entry');
    changeEntryBtn.position(10, height + 120);
    let transposeBtn = p.createButton('Transpose');
    transposeBtn.position(10, height + 150);
    transposeBtn.mousePressed(() => {
        M1 = M1.transpose();
        if (operator === "+") {
            M3 = M1.add(M2);
        } else if (operator === "-") {
            M3 = M1.diff(M2);
        } else if (operator === "*") {
            M3 = M1.mult(M2);
        }
    });

    let multInput = p.createInput();
    multInput.position(10, height + 180);
    multInput.attribute('placeholder', 'Scalar');
    let scalarMultBtn = p.createButton('Scalar Mult');
    scalarMultBtn.position(10, height + 210);
    scalarMultBtn.mousePressed(() => {
        // @ts-ignore
        M1 = M1.scalarMult(parseFloat(multInput.value()));
    });


    changeEntryBtn.mousePressed(() => {
        // @ts-ignore
        const row = parseInt(rowInput.value()) - 1; // Adjusting for zero-indexing
        // @ts-ignore
        const col = parseInt(colInput.value()) - 1; // Adjusting for zero-indexing
        // @ts-ignore
        const data = parseFloat(dataInput.value());
        M1.changeEntry(row, col, data);

        if (operator === "+") {
            M3 = M1.add(M2);
        } else if (operator === "-") {
            M3 = M1.diff(M2);
        } else if (operator === "*") {
            M3 = M1.mult(M2);
        }
    });
    let M1 = new SparseMatrix(3);
    M1.changeEntry(0, 0, 1);
    M1.changeEntry(1, 0, 1);
    M1.changeEntry(2, 0, 1);

    let M2 = new SparseMatrix(3);
    M2.changeEntry(0, 0, 1);
    M2.changeEntry(1, 1, 1);
    M2.changeEntry(2, 2, 1);

    let M3 = M1.add(M2);

    let operator = "+"
    let printMatrixBtn = p.createButton('Print Matrix');
    printMatrixBtn.position(900, height + 30);
    let printDisplay = p.createP("Print Matrix display");
    printDisplay.attribute('style', 'color: white');
    printDisplay.position(900, height + 60);
    printMatrixBtn.mousePressed(() => {
        printDisplay.html("Print Matrix display<br>" + M1.printMatrix());
        printDisplay.position(900,  height + 60);
    });

    let addBtn = p.createButton('Add');
    addBtn.position(10, height + 270);
    addBtn.mousePressed(() => {
        M3 = M1.add(M2);
        operator = "+";
    });


    let matrixInput = p.createElement('textarea');
    matrixInput.position(600, height + 60);
    matrixInput.size(200, 100); // Set the size of the text area (width, height)
    let formatText = p.createP("Matrix input for add, sub, mult, newMatrix, <br>Format: n<br> row, col, data<br>row, col, data<br> ...<br> (same as input for class)")
    formatText.attribute('style', 'color: white');
    formatText.position(300, height);
    matrixInput.attribute('placeholder', 'Matrix input');
    let parseInputBtn = p.createButton('parse input');
    parseInputBtn.position(600, height + 30);
    parseInputBtn.mousePressed(() => {
        // let input = matrixInput.value();
        // let lines = input.split(" ");
        // let n = parseInt(lines[0]);
        // let entiresM1 = lines[1];
        // let entiresM2 = lines[2];
        // let newMatrix1 = new SparseMatrix(n);
        // let newMatrix2 = new SparseMatrix(n);


        let input = matrixInput.value();
        // @ts-ignore
        let lines = input.split("\n"); // Split by newline to get each line
        let firstLine = lines[0].split(" "); // Split the first line by space
    
        let n = parseInt(firstLine[0]); // Size of the matrices
        let entriesCountM1 = parseInt(firstLine[1]); // Number of entries for the first matrix
        let entriesCountM2 = parseInt(firstLine[2]); // Number of entries for the second matrix
    
        let newMatrix1 = new SparseMatrix(n);
        let newMatrix2 = new SparseMatrix(n);
    
        // Parsing entries for the first matrix
        for (let i = 1; i <= entriesCountM1; i++) {
            let entryParts = lines[i].split(" ");
            let row = parseInt(entryParts[0]) - 1; // Adjust for zero-indexing
            let col = parseInt(entryParts[1]) - 1; // Adjust for zero-indexing
            let value = parseFloat(entryParts[2]);
            newMatrix1.changeEntry(row, col, value);
        }
    
        // Parsing entries for the second matrix
        for (let i = 1 + entriesCountM1; i < 1 + entriesCountM1 + entriesCountM2; i++) {
            let entryParts = lines[i].split(" ");
            let row = parseInt(entryParts[0]) - 1; // Adjust for zero-indexing
            let col = parseInt(entryParts[1]) - 1; // Adjust for zero-indexing
            let value = parseFloat(entryParts[2]);
            newMatrix2.changeEntry(row, col, value);
        }
        M1 = newMatrix1;
        M2 = newMatrix2;
        if (operator === "+") {
            M3 = M1.add(M2);
        } else if (operator === "-") {
            M3 = M1.diff(M2);
        } else if (operator === "*") {
            M3 = M1.mult(M2);
        }
    });


    let subBtn = p.createButton('Sub');
    subBtn.position(10, height + 300);

    subBtn.mousePressed(() => {
        M3 = M1.diff(M2);
        operator = "-";
        console.log(M3.printMatrix())
    });

    let multBtn = p.createButton('Mult');
    multBtn.position(10, height + 330);
    multBtn.mousePressed(() => {
        M3 = M1.mult(M2);
        operator = "*";
    });

    p.setup = () => {
        p.createCanvas(width, height);
    };

    p.draw = () => {
        p.background("white");

        // Define proportions
        const matrixProportion = 0.25; // Each matrix will take up 25% of the canvas width
        const spacingProportion = 0.05; // Spacing between matrices will be 5% of the canvas width

        // Calculate matrix dimensions
        let matrixWidth = width * matrixProportion;
        let matrixHeight = matrixWidth; // Making the matrix square, adjust if necessary

        // Calculate positions based on proportions
        let firstMatrixX = width * spacingProportion;
        let secondMatrixX = firstMatrixX + matrixWidth + width * spacingProportion;
        let thirdMatrixX = secondMatrixX + matrixWidth + width * spacingProportion;

        // Draw the matrices
        drawMatrix(M1, firstMatrixX, y, matrixWidth, matrixHeight);
        //draw nnz of M1
        p.textSize(32);
        p.text("NNZ: " + M1.NNZ, firstMatrixX, y + matrixHeight + 60);
        drawMatrix(M2, secondMatrixX, y, matrixWidth, matrixHeight);
        p.text("NNZ: " + M2.NNZ, secondMatrixX, y + matrixHeight + 60);
        drawMatrix(M3, thirdMatrixX, y, matrixWidth, matrixHeight);
        p.text("NNZ: " + M3.NNZ, thirdMatrixX, y + matrixHeight + 60);

        // Draw operators
        p.textSize(48);
        let operatorX = (secondMatrixX + firstMatrixX + matrixWidth) / 2 - p.textWidth('+') / 2;
        p.text(operator, operatorX, y + matrixHeight / 2 + p.textSize() / 2);
        let equalsX = (secondMatrixX + matrixWidth + thirdMatrixX) / 2 - p.textWidth('=') / 2;
        p.text('=', equalsX, y + matrixHeight / 2 + p.textSize() / 2);
    };
    function drawMatrix(M: SparseMatrix, startX: number, startY: number, matrixWidth: number, matrixHeight: number) {
        // Draw matrix brackets
        p.strokeWeight(3);
        p.line(startX, startY, startX, startY + matrixHeight);
        p.line(startX + matrixWidth, startY, startX + matrixWidth, startY + matrixHeight);
        p.line(startX, startY, startX + 0.5 * x, startY);
        p.line(startX, startY + matrixHeight, startX + 0.5 * x, startY + matrixHeight);
        p.line(startX + matrixWidth, startY, startX + matrixWidth - 0.5 * x, startY);
        p.line(startX + matrixWidth, startY + matrixHeight, startX + matrixWidth - 0.5 * x, startY + matrixHeight);

        // Draw the entries of the matrix
        let entryWidth = matrixWidth / M.size;
        let entryHeight = matrixHeight / M.size;
        for (let rowIndex = 0; rowIndex < M.matrix.length; rowIndex++) {
            for (let entry of M.matrix[rowIndex]) {
                p.textSize(32); // Adjust as needed
                p.text(entry.data.toFixed(1), startX + entryWidth * entry.col + entryWidth / 2 - p.textSize() / 4, startY + entryHeight * rowIndex + entryHeight / 2 + p.textSize() / 4);
            }
        }
    }




});
