class SetVisualizer {
    constructor() {
        this.sets = new Map();
        this.selectedSets = new Set();
        this.currentOperation = null;
        this.showLabels = true;
        this.isDarkTheme = false;
        this.colors = [
            '#FF6B6B80', '#4ECDC480', '#45B7D180', '#96CEB480', '#FFEAA780',
            '#DDA0DD80', '#98D8C880', '#F7DC6F80', '#BB8FCE80', '#85C1E980'
        ];
        this.originalColors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
            '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
        ];
        this.canvas = document.getElementById('vennCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.circlePositions = new Map();
        this.universalSet = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupCanvas();
        this.setupTheme();
        this.updateCanvasDataAttribute();
        this.renderMathExpressions();
    }

    setupCanvas() {
        this.canvas.width = 800;
        this.canvas.height = 600;
    }

    setupEventListeners() {
        document.getElementById('addSetBtn').addEventListener('click', () => this.addSet());
        document.getElementById('randomSetBtn').addEventListener('click', () => this.generateRandomSet());
        document.getElementById('intersectionBtn').addEventListener('click', () => this.calculateIntersection());
        document.getElementById('unionBtn').addEventListener('click', () => this.calculateUnion());
        document.getElementById('differenceBtn').addEventListener('click', () => this.calculateDifference());
        document.getElementById('symmetricBtn').addEventListener('click', () => this.calculateSymmetricDifference());
        document.getElementById('clearBtn').addEventListener('click', () => this.clearAll());
        
        document.getElementById('setElements').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addSet();
        });

        document.getElementById('operationSets').addEventListener('change', () => {
            this.updateSelectedSets();
            this.visualizeSets();
        });

        document.getElementById('differenceSetA').addEventListener('change', () => this.updateOperationUI());
        document.getElementById('differenceSetB').addEventListener('change', () => this.updateOperationUI());
        document.getElementById('symmetricSetA').addEventListener('change', () => this.updateOperationUI());
        document.getElementById('symmetricSetB').addEventListener('change', () => this.updateOperationUI());

        document.querySelector('.theme-switch').addEventListener('click', () => this.toggleTheme());
    }

    setupTheme() {
        const savedTheme = localStorage.getItem('venn-theme');
        if (savedTheme === 'dark') {
            this.toggleTheme();
        }
    }

    addSet() {
        const name = document.getElementById('setName').value.trim().toUpperCase();
        const elementsInput = document.getElementById('setElements').value.trim();
        
        if (!name || !elementsInput) {
            alert('Пожалуйста, введите имя множества и элементы');
            return;
        }

        if (!/^[A-Z]$/.test(name)) {
            alert('Имя множества должно быть одной буквой от A до Z');
            return;
        }

        if (this.sets.has(name)) {
            alert(`Множество с именем ${name} уже существует!`);
            return;
        }

        const elements = elementsInput.split(',')
            .map(el => el.trim())
            .filter(el => el !== '')
            .map(el => {
                const num = Number(el);
                return isNaN(num) ? el : num;
            });

        if (elements.length === 0) {
            alert('Пожалуйста, введите хотя бы один элемент');
            return;
        }

        const colorIndex = this.sets.size % this.colors.length;
        const setData = {
            name: name,
            elements: [...new Set(elements)],
            color: this.colors[colorIndex],
            originalColor: this.originalColors[colorIndex]
        };

        this.sets.set(name, setData);
        this.updateUI();
        document.getElementById('setElements').value = '';
        
        const nextChar = String.fromCharCode(name.charCodeAt(0) + 1);
        if (nextChar <= 'Z') {
            document.getElementById('setName').value = nextChar;
        }
        
        this.updateCanvasDataAttribute();
        this.showNotification(`Множество ${name} создано`);
    }

    generateRandomSet() {
        const name = document.getElementById('setName').value.trim().toUpperCase() || 'A';
        const elementCount = Math.floor(Math.random() * 8) + 3;
        const elements = [];
        
        for (let i = 0; i < elementCount; i++) {
            elements.push(Math.floor(Math.random() * 20) + 1);
        }
        
        document.getElementById('setElements').value = elements.join(', ');
        this.addSet();
    }

    updateUI() {
        this.updateSetsList();
        this.updateOperationSets();
        this.updateDifferenceControls();
        this.updateSelectedSets();
        this.visualizeSets();
        this.updateRelationshipInfo();
        this.updateElementInfo();
    }

    updateSetsList() {
        const setsList = document.getElementById('setsList');
        setsList.innerHTML = '';

        this.sets.forEach((setData, setName) => {
            const setItem = document.createElement('div');
            setItem.className = 'set-item';
            setItem.innerHTML = `
                <div>
                    <span class="set-name">${setData.name}</span>
                    <div class="set-elements">{${setData.elements.join(', ')}}</div>
                </div>
                <button class="delete-set" onclick="visualizer.deleteSet('${setName}')">×</button>
            `;
            setsList.appendChild(setItem);
        });
    }

    updateOperationSets() {
        const operationSets = document.getElementById('operationSets');
        operationSets.innerHTML = '';

        this.sets.forEach((setData, setName) => {
            const checkbox = document.createElement('div');
            checkbox.className = 'set-checkbox';
            checkbox.innerHTML = `
                <input type="checkbox" id="set-${setName}" value="${setName}" 
                    ${this.selectedSets.has(setName) ? 'checked' : ''}>
                <label for="set-${setName}">
                    <span class="set-color-indicator" style="background: ${setData.originalColor}"></span>
                    ${setData.name} {${setData.elements.join(', ')}}
                </label>
            `;
            operationSets.appendChild(checkbox);
        });
    }

    updateDifferenceControls() {
        const updateSelect = (selectId) => {
            const select = document.getElementById(selectId);
            const current = select.value;
            select.innerHTML = '<option value="">Выберите множество</option>';
            
            this.sets.forEach((setData, setName) => {
                const option = document.createElement('option');
                option.value = setName;
                option.textContent = `${setName} {${setData.elements.join(', ')}}`;
                if (setName === current) option.selected = true;
                select.appendChild(option);
            });
        };

        updateSelect('differenceSetA');
        updateSelect('differenceSetB');
        updateSelect('symmetricSetA');
        updateSelect('symmetricSetB');
    }

    updateOperationUI() {
        const diffA = document.getElementById('differenceSetA').value;
        const diffB = document.getElementById('differenceSetB').value;
        const symA = document.getElementById('symmetricSetA').value;
        const symB = document.getElementById('symmetricSetB').value;
        
        if (diffA && diffB) {
            this.selectedSets.clear();
            this.selectedSets.add(diffA);
            this.selectedSets.add(diffB);
            this.updateOperationSets();
        }
        
        if (symA && symB) {
            this.selectedSets.clear();
            this.selectedSets.add(symA);
            this.selectedSets.add(symB);
            this.updateOperationSets();
        }
    }

    updateSelectedSets() {
        this.selectedSets.clear();
        const checkboxes = document.querySelectorAll('#operationSets input[type="checkbox"]:checked');
        checkboxes.forEach(checkbox => {
            this.selectedSets.add(checkbox.value);
        });
    }

    updateCanvasDataAttribute() {
        const hasSets = this.sets.size > 0;
        this.canvas.setAttribute('data-has-sets', hasSets);
    }

    deleteSet(setName) {
        this.sets.delete(setName);
        this.selectedSets.delete(setName);
        this.circlePositions.delete(setName);
        this.updateUI();
        this.clearResult();
        this.updateCanvasDataAttribute();
        this.showNotification(`Множество ${setName} удалено`);
    }

    calculateCirclePositions() {
        const setsArray = Array.from(this.sets.values());
        const n = setsArray.length;
        
        if (n === 0) return;
        
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        if (n === 1) {
            this.circlePositions.set(setsArray[0].name, { 
                x: centerX, 
                y: centerY, 
                r: 150 
            });
            return;
        }
        
        if (n === 2) {
            const setA = setsArray[0];
            const setB = setsArray[1];
            
            const hasIntersection = this.hasIntersection(setA, setB);
            const isASubsetOfB = this.isSubset(setA, setB);
            const isBSubsetOfA = this.isSubset(setB, setA);
            
            const baseRadius = 120;
            
            if (!hasIntersection) {
                this.circlePositions.set(setA.name, { 
                    x: centerX - baseRadius * 1.8, 
                    y: centerY, 
                    r: baseRadius 
                });
                this.circlePositions.set(setB.name, { 
                    x: centerX + baseRadius * 1.8, 
                    y: centerY, 
                    r: baseRadius 
                });
            } else if (isASubsetOfB) {
                this.circlePositions.set(setB.name, { 
                    x: centerX, 
                    y: centerY, 
                    r: baseRadius 
                });
                this.circlePositions.set(setA.name, { 
                    x: centerX, 
                    y: centerY, 
                    r: baseRadius * 0.6 
                });
            } else if (isBSubsetOfA) {
                this.circlePositions.set(setA.name, { 
                    x: centerX, 
                    y: centerY, 
                    r: baseRadius 
                });
                this.circlePositions.set(setB.name, { 
                    x: centerX, 
                    y: centerY, 
                    r: baseRadius * 0.6 
                });
            } else {
                const offset = baseRadius * 0.8;
                this.circlePositions.set(setA.name, { 
                    x: centerX - offset, 
                    y: centerY, 
                    r: baseRadius 
                });
                this.circlePositions.set(setB.name, { 
                    x: centerX + offset, 
                    y: centerY, 
                    r: baseRadius 
                });
            }
            return;
        }
        
        if (n === 3) {
            const positions = this.calculateCirclePositionsForThreeSets(setsArray[0], setsArray[1], setsArray[2]);
            for (const [setName, pos] of Object.entries(positions)) {
                this.circlePositions.set(setName, pos);
            }
            return;
        }

        if (n >= 4) {
            this.calculateForceDirectedPositions(100);
            return;
        }
    }

    calculateForceDirectedPositions(iterations = 200) {
        const setsArray = Array.from(this.sets.values());
        if (setsArray.length < 4) return;

        const kRepulsion = 5000;
        const kAttraction = 0.1;
        const damping = 0.85;
        const centerForce = 0.001;
        
        const positions = new Map();
        const velocities = new Map();
        
        setsArray.forEach(set => {
            if (!this.circlePositions.has(set.name)) {
                positions.set(set.name, {
                    x: Math.random() * (this.canvas.width - 200) + 100,
                    y: Math.random() * (this.canvas.height - 200) + 100
                });
            } else {
                positions.set(set.name, { ...this.circlePositions.get(set.name) });
            }
            velocities.set(set.name, { x: 0, y: 0 });
        });

        for (let iter = 0; iter < iterations; iter++) {
            for (let i = 0; i < setsArray.length; i++) {
                for (let j = i + 1; j < setsArray.length; j++) {
                    const setA = setsArray[i];
                    const setB = setsArray[j];
                    const posA = positions.get(setA.name);
                    const posB = positions.get(setB.name);
                    
                    const dx = posB.x - posA.x;
                    const dy = posB.y - posA.y;
                    const distance = Math.sqrt(dx * dx + dy * dy) || 1;
                    
                    const repulsionForce = kRepulsion / (distance * distance);
                    const fx = (dx / distance) * repulsionForce;
                    const fy = (dy / distance) * repulsionForce;
                    
                    velocities.get(setA.name).x -= fx;
                    velocities.get(setA.name).y -= fy;
                    velocities.get(setB.name).x += fx;
                    velocities.get(setB.name).y += fy;
                    
                    if (this.hasIntersection(setA, setB)) {
                        const intersectionSize = this.getIntersection(setA, setB).size;
                        const unionSize = new Set([...setA.elements, ...setB.elements]).size;
                        const overlap = intersectionSize / unionSize;
                        
                        const desiredDistance = 200 * (1 - overlap);
                        const attractionForce = kAttraction * (distance - desiredDistance);
                        
                        const afx = (dx / distance) * attractionForce;
                        const afy = (dy / distance) * attractionForce;
                        
                        velocities.get(setA.name).x += afx;
                        velocities.get(setA.name).y += afy;
                        velocities.get(setB.name).x -= afx;
                        velocities.get(setB.name).y -= afy;
                    }
                }
                
                const set = setsArray[i];
                const pos = positions.get(set.name);
                const v = velocities.get(set.name);
                
                const centerX = this.canvas.width / 2;
                const centerY = this.canvas.height / 2;
                const dx = centerX - pos.x;
                const dy = centerY - pos.y;
                
                v.x += dx * centerForce;
                v.y += dy * centerForce;
            }
            
            setsArray.forEach(set => {
                const pos = positions.get(set.name);
                const v = velocities.get(set.name);
                
                v.x *= damping;
                v.y *= damping;
                
                pos.x += v.x;
                pos.y += v.y;
                
                pos.x = Math.max(100, Math.min(this.canvas.width - 100, pos.x));
                pos.y = Math.max(100, Math.min(this.canvas.height - 100, pos.y));
            });
        }
        
        positions.forEach((pos, setName) => {
            this.circlePositions.set(setName, {
                x: pos.x,
                y: pos.y,
                r: 100
            });
        });
    }

    calculateCirclePositionsForThreeSets(setA, setB, setC) {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const baseRadius = 100;
        
        const relationship = this.determineThreeSetsRelationship(setA, setB, setC);
        const positions = {};
        
        switch(relationship.type) {
            case 1:
                positions[setA.name] = { x: centerX - baseRadius * 1.8, y: centerY - baseRadius, r: baseRadius };
                positions[setB.name] = { x: centerX, y: centerY + baseRadius * 1.2, r: baseRadius };
                positions[setC.name] = { x: centerX + baseRadius * 1.8, y: centerY - baseRadius, r: baseRadius };
                break;
            case 2:
                if (relationship.details.intersecting === 'AB') {
                    positions[setA.name] = { x: centerX - baseRadius * 0.8, y: centerY, r: baseRadius };
                    positions[setB.name] = { x: centerX + baseRadius * 0.8, y: centerY, r: baseRadius };
                    positions[setC.name] = { x: centerX, y: centerY - baseRadius * 2, r: baseRadius };
                } else if (relationship.details.intersecting === 'AC') {
                    positions[setA.name] = { x: centerX - baseRadius * 0.8, y: centerY, r: baseRadius };
                    positions[setC.name] = { x: centerX + baseRadius * 0.8, y: centerY, r: baseRadius };
                    positions[setB.name] = { x: centerX, y: centerY - baseRadius * 2, r: baseRadius };
                } else {
                    positions[setB.name] = { x: centerX - baseRadius * 0.8, y: centerY, r: baseRadius };
                    positions[setC.name] = { x: centerX + baseRadius * 0.8, y: centerY, r: baseRadius };
                    positions[setA.name] = { x: centerX, y: centerY - baseRadius * 2, r: baseRadius };
                }
                break;
            case 3:
                if (relationship.details.chain === 'A-B-C') {
                    positions[setA.name] = { x: centerX - baseRadius * 1.6, y: centerY, r: baseRadius };
                    positions[setB.name] = { x: centerX, y: centerY, r: baseRadius };
                    positions[setC.name] = { x: centerX + baseRadius * 1.6, y: centerY, r: baseRadius };
                } else if (relationship.details.chain === 'A-B,A-C') {
                    positions[setA.name] = { x: centerX, y: centerY, r: baseRadius };
                    positions[setB.name] = { x: centerX - baseRadius * 1.1, y: centerY + baseRadius * 1.1, r: baseRadius };
                    positions[setC.name] = { x: centerX + baseRadius * 1.1, y: centerY + baseRadius * 1.1, r: baseRadius };
                } else {
                    positions[setC.name] = { x: centerX, y: centerY, r: baseRadius };
                    positions[setA.name] = { x: centerX - baseRadius * 1.1, y: centerY - baseRadius * 1.1, r: baseRadius };
                    positions[setB.name] = { x: centerX + baseRadius * 1.1, y: centerY - baseRadius * 1.1, r: baseRadius };
                }
                break;
            case 4:
                positions[setA.name] = { x: centerX - baseRadius * 0.5, y: centerY - baseRadius * 0.3, r: baseRadius };
                positions[setB.name] = { x: centerX + baseRadius * 0.5, y: centerY - baseRadius * 0.3, r: baseRadius };
                positions[setC.name] = { x: centerX, y: centerY + baseRadius * 0.5, r: baseRadius };
                break;
            case 5:
                const innerRadius = baseRadius * 0.6;
                const subset5 = relationship.details.subset;
                
                if (subset5 === 'A_in_B') {
                    positions[setB.name] = { x: centerX - baseRadius * 0.3, y: centerY, r: baseRadius };
                    positions[setA.name] = { x: centerX - baseRadius * 0.3, y: centerY, r: innerRadius };
                    positions[setC.name] = { x: centerX + baseRadius * 1.2, y: centerY, r: baseRadius };
                } else if (subset5 === 'B_in_A') {
                    positions[setA.name] = { x: centerX + baseRadius * 0.3, y: centerY, r: baseRadius };
                    positions[setB.name] = { x: centerX + baseRadius * 0.3, y: centerY, r: innerRadius };
                    positions[setC.name] = { x: centerX - baseRadius * 1.2, y: centerY, r: baseRadius };
                } else if (subset5 === 'A_in_C') {
                    positions[setC.name] = { x: centerX, y: centerY - baseRadius * 0.3, r: baseRadius };
                    positions[setA.name] = { x: centerX, y: centerY - baseRadius * 0.3, r: innerRadius };
                    positions[setB.name] = { x: centerX, y: centerY + baseRadius * 1.2, r: baseRadius };
                } else if (subset5 === 'C_in_A') {
                    positions[setA.name] = { x: centerX, y: centerY + baseRadius * 0.3, r: baseRadius };
                    positions[setC.name] = { x: centerX, y: centerY + baseRadius * 0.3, r: innerRadius };
                    positions[setB.name] = { x: centerX, y: centerY - baseRadius * 1.2, r: baseRadius };
                } else if (subset5 === 'B_in_C') {
                    positions[setC.name] = { x: centerX - baseRadius * 0.5, y: centerY, r: baseRadius };
                    positions[setB.name] = { x: centerX - baseRadius * 0.5, y: centerY, r: innerRadius };
                    positions[setA.name] = { x: centerX + baseRadius * 1.0, y: centerY, r: baseRadius };
                } else {
                    positions[setB.name] = { x: centerX + baseRadius * 0.5, y: centerY, r: baseRadius };
                    positions[setC.name] = { x: centerX + baseRadius * 0.5, y: centerY, r: innerRadius };
                    positions[setA.name] = { x: centerX - baseRadius * 1.0, y: centerY, r: baseRadius };
                }
                break;
            case 6:
                const innerRadius6 = baseRadius * 0.6;
                const subset6 = relationship.details.subset;
                
                if (subset6 === 'A_in_B') {
                    positions[setB.name] = { x: centerX, y: centerY, r: baseRadius };
                    positions[setA.name] = { x: centerX, y: centerY, r: innerRadius6 };
                    positions[setC.name] = { x: centerX + baseRadius * 1.0, y: centerY, r: baseRadius };
                } else if (subset6 === 'B_in_A') {
                    positions[setA.name] = { x: centerX, y: centerY, r: baseRadius };
                    positions[setB.name] = { x: centerX, y: centerY, r: innerRadius6 };
                    positions[setC.name] = { x: centerX - baseRadius * 1.0, y: centerY, r: baseRadius };
                } else if (subset6 === 'A_in_C') {
                    positions[setC.name] = { x: centerX, y: centerY, r: baseRadius };
                    positions[setA.name] = { x: centerX, y: centerY, r: innerRadius6 };
                    positions[setB.name] = { x: centerX, y: centerY + baseRadius * 1.0, r: baseRadius };
                } else if (subset6 === 'C_in_A') {
                    positions[setA.name] = { x: centerX, y: centerY, r: baseRadius };
                    positions[setC.name] = { x: centerX, y: centerY, r: innerRadius6 };
                    positions[setB.name] = { x: centerX, y: centerY - baseRadius * 1.0, r: baseRadius };
                } else if (subset6 === 'B_in_C') {
                    positions[setC.name] = { x: centerX - baseRadius * 0.5, y: centerY, r: baseRadius };
                    positions[setB.name] = { x: centerX - baseRadius * 0.5, y: centerY, r: innerRadius6 };
                    positions[setA.name] = { x: centerX + baseRadius * 0.8, y: centerY, r: baseRadius };
                } else {
                    positions[setB.name] = { x: centerX + baseRadius * 0.5, y: centerY, r: baseRadius };
                    positions[setC.name] = { x: centerX + baseRadius * 0.5, y: centerY, r: innerRadius6 };
                    positions[setA.name] = { x: centerX - baseRadius * 0.8, y: centerY, r: baseRadius };
                }
                break;
            default:
                positions[setA.name] = { x: centerX - baseRadius * 0.5, y: centerY - baseRadius * 0.3, r: baseRadius };
                positions[setB.name] = { x: centerX + baseRadius * 0.5, y: centerY - baseRadius * 0.3, r: baseRadius };
                positions[setC.name] = { x: centerX, y: centerY + baseRadius * 0.5, r: baseRadius };
        }
        
        return positions;
    }

    arraysEqual(arr1, arr2) {
        if (arr1.length !== arr2.length) return false;
        const sorted1 = [...arr1].sort();
        const sorted2 = [...arr2].sort();
        return sorted1.every((value, index) => value === sorted2[index]);
    }

    getIntersection(setA, setB) {
        return new Set(setA.elements.filter(x => setB.elements.includes(x)));
    }

    hasIntersection(setA, setB) {
        return this.getIntersection(setA, setB).size > 0;
    }

    isSubset(setA, setB) {
        const intersection = this.getIntersection(setA, setB);
        return this.arraysEqual(Array.from(intersection), setA.elements);
    }

    determineThreeSetsRelationship(setA, setB, setC) {
        const AB_intersect = this.hasIntersection(setA, setB);
        const AB_subset_A_in_B = this.isSubset(setA, setB);
        const AB_subset_B_in_A = this.isSubset(setB, setA);
        const AB_subset = AB_subset_A_in_B || AB_subset_B_in_A;
        
        const AC_intersect = this.hasIntersection(setA, setC);
        const AC_subset_A_in_C = this.isSubset(setA, setC);
        const AC_subset_C_in_A = this.isSubset(setC, setA);
        const AC_subset = AC_subset_A_in_C || AC_subset_C_in_A;
        
        const BC_intersect = this.hasIntersection(setB, setC);
        const BC_subset_B_in_C = this.isSubset(setB, setC);
        const BC_subset_C_in_B = this.isSubset(setC, setB);
        const BC_subset = BC_subset_B_in_C || BC_subset_C_in_B;

        if (!AB_intersect && !AC_intersect && !BC_intersect) {
            return { type: 1, details: 'DISJOINT_ALL' };
        }

        if (AB_intersect && !AC_intersect && !BC_intersect && !AB_subset) {
            return { type: 2, details: { intersecting: 'AB', subset: false } };
        }
        if (!AB_intersect && AC_intersect && !BC_intersect && !AC_subset) {
            return { type: 2, details: { intersecting: 'AC', subset: false } };
        }
        if (!AB_intersect && !AC_intersect && BC_intersect && !BC_subset) {
            return { type: 2, details: { intersecting: 'BC', subset: false } };
        }

        if (AB_intersect && BC_intersect && !AC_intersect && !AB_subset && !BC_subset) {
            return { type: 3, details: { chain: 'A-B-C', nonIntersecting: 'AC' } };
        }
        if (AB_intersect && AC_intersect && !BC_intersect && !AB_subset && !AC_subset) {
            return { type: 3, details: { chain: 'A-B,A-C', nonIntersecting: 'BC' } };
        }
        if (AC_intersect && BC_intersect && !AB_intersect && !AC_subset && !BC_subset) {
            return { type: 3, details: { chain: 'A-C,B-C', nonIntersecting: 'AB' } };
        }

        if (AB_intersect && AC_intersect && BC_intersect && !AB_subset && !AC_subset && !BC_subset) {
            return { type: 4, details: 'ALL_INTERSECTING' };
        }

        if (AB_subset_A_in_B && BC_intersect && !AC_intersect) {
            return { type: 5, details: { subset: 'A_in_B', intersecting: 'BC', nonIntersecting: 'AC' } };
        }
        if (AB_subset_B_in_A && AC_intersect && !BC_intersect) {
            return { type: 5, details: { subset: 'B_in_A', intersecting: 'AC', nonIntersecting: 'BC' } };
        }
        if (AC_subset_A_in_C && BC_intersect && !AB_intersect) {
            return { type: 5, details: { subset: 'A_in_C', intersecting: 'BC', nonIntersecting: 'AB' } };
        }
        if (AC_subset_C_in_A && AB_intersect && !BC_intersect) {
            return { type: 5, details: { subset: 'C_in_A', intersecting: 'AB', nonIntersecting: 'BC' } };
        }
        if (BC_subset_B_in_C && AB_intersect && !AC_intersect) {
            return { type: 5, details: { subset: 'B_in_C', intersecting: 'AB', nonIntersecting: 'AC' } };
        }
        if (BC_subset_C_in_B && AC_intersect && !AB_intersect) {
            return { type: 5, details: { subset: 'C_in_B', intersecting: 'AC', nonIntersecting: 'AB' } };
        }

        if (AB_subset_A_in_B && AC_intersect && BC_intersect) {
            return { type: 6, details: { subset: 'A_in_B', intersecting: 'AC_BC' } };
        }
        if (AB_subset_B_in_A && AC_intersect && BC_intersect) {
            return { type: 6, details: { subset: 'B_in_A', intersecting: 'AC_BC' } };
        }
        if (AC_subset_A_in_C && AB_intersect && BC_intersect) {
            return { type: 6, details: { subset: 'A_in_C', intersecting: 'AB_BC' } };
        }
        if (AC_subset_C_in_A && AB_intersect && BC_intersect) {
            return { type: 6, details: { subset: 'C_in_A', intersecting: 'AB_BC' } };
        }
        if (BC_subset_B_in_C && AB_intersect && AC_intersect) {
            return { type: 6, details: { subset: 'B_in_C', intersecting: 'AB_AC' } };
        }
        if (BC_subset_C_in_B && AB_intersect && AC_intersect) {
            return { type: 6, details: { subset: 'C_in_B', intersecting: 'AB_AC' } };
        }

        return { type: 4, details: 'DEFAULT_ALL_INTERSECTING' };
    }

    drawCircle(setData, highlight = false) {
        const pos = this.circlePositions.get(setData.name);
        if (!pos) return;

        this.ctx.beginPath();
        this.ctx.arc(pos.x, pos.y, pos.r, 0, 2 * Math.PI);
        
        if (highlight) {
            this.ctx.fillStyle = setData.originalColor + 'CC';
            this.ctx.strokeStyle = '#FFD700';
            this.ctx.lineWidth = 4;
        } else {
            this.ctx.fillStyle = setData.color;
            this.ctx.strokeStyle = setData.originalColor;
            this.ctx.lineWidth = 2;
        }
        
        this.ctx.fill();
        this.ctx.stroke();

        if (this.showLabels) {
            this.ctx.fillStyle = this.isDarkTheme ? '#fff' : '#333';
            this.ctx.font = 'bold 20px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(setData.name, pos.x, pos.y);
        }
    }

    drawSetElements(setData) {
        const pos = this.circlePositions.get(setData.name);
        if (!pos || setData.elements.length > 8) return;

        this.ctx.fillStyle = this.isDarkTheme ? '#e0e0e0' : '#333';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'center';
        
        setData.elements.forEach((element, index) => {
            const angle = (2 * Math.PI * index) / setData.elements.length;
            const distance = pos.r * 0.7;
            const textX = pos.x + Math.cos(angle) * distance;
            const textY = pos.y + Math.sin(angle) * distance;
            
            this.ctx.fillText(element, textX, textY);
        });
    }

    drawIntersectionAreas() {
        const setsArray = Array.from(this.sets.values());
        if (setsArray.length !== 2 && setsArray.length !== 3) return;
        
        if (setsArray.length === 2) {
            const setA = setsArray[0];
            const setB = setsArray[1];
            
            if (this.hasIntersection(setA, setB) && 
                !this.isSubset(setA, setB) && 
                !this.isSubset(setB, setA)) {
                const posA = this.circlePositions.get(setA.name);
                const posB = this.circlePositions.get(setB.name);
                
                if (!posA || !posB) return;
                
                this.ctx.save();
                this.ctx.globalCompositeOperation = 'multiply';
                
                this.ctx.beginPath();
                this.ctx.arc(posA.x, posA.y, posA.r, 0, 2 * Math.PI);
                this.ctx.fillStyle = setA.originalColor + '80';
                this.ctx.fill();
                
                this.ctx.beginPath();
                this.ctx.arc(posB.x, posB.y, posB.r, 0, 2 * Math.PI);
                this.ctx.fillStyle = setB.originalColor + '80';
                this.ctx.fill();
                
                this.ctx.restore();
            }
        } else if (setsArray.length === 3) {
            const [setA, setB, setC] = setsArray;
            
            const posA = this.circlePositions.get(setA.name);
            const posB = this.circlePositions.get(setB.name);
            const posC = this.circlePositions.get(setC.name);
            
            if (!posA || !posB || !posC) return;
            
            if (this.hasIntersection(setA, setB)) {
                this.ctx.save();
                this.ctx.globalCompositeOperation = 'multiply';
                
                this.ctx.beginPath();
                this.ctx.arc(posA.x, posA.y, posA.r, 0, 2 * Math.PI);
                this.ctx.fillStyle = setA.originalColor + '60';
                this.ctx.fill();
                
                this.ctx.beginPath();
                this.ctx.arc(posB.x, posB.y, posB.r, 0, 2 * Math.PI);
                this.ctx.fillStyle = setB.originalColor + '60';
                this.ctx.fill();
                
                this.ctx.restore();
            }
            
            if (this.hasIntersection(setA, setC)) {
                this.ctx.save();
                this.ctx.globalCompositeOperation = 'multiply';
                
                this.ctx.beginPath();
                this.ctx.arc(posA.x, posA.y, posA.r, 0, 2 * Math.PI);
                this.ctx.fillStyle = setA.originalColor + '60';
                this.ctx.fill();
                
                this.ctx.beginPath();
                this.ctx.arc(posC.x, posC.y, posC.r, 0, 2 * Math.PI);
                this.ctx.fillStyle = setC.originalColor + '60';
                this.ctx.fill();
                
                this.ctx.restore();
            }
            
            if (this.hasIntersection(setB, setC)) {
                this.ctx.save();
                this.ctx.globalCompositeOperation = 'multiply';
                
                this.ctx.beginPath();
                this.ctx.arc(posB.x, posB.y, posB.r, 0, 2 * Math.PI);
                this.ctx.fillStyle = setB.originalColor + '60';
                this.ctx.fill();
                
                this.ctx.beginPath();
                this.ctx.arc(posC.x, posC.y, posC.r, 0, 2 * Math.PI);
                this.ctx.fillStyle = setC.originalColor + '60';
                this.ctx.fill();
                
                this.ctx.restore();
            }
            
            const intersectionAB = this.getIntersection(setA, setB);
            const intersectionABC = new Set([...intersectionAB].filter(x => setC.elements.includes(x)));
            
            if (intersectionABC.size > 0) {
                this.ctx.save();
                this.ctx.globalCompositeOperation = 'multiply';
                
                this.ctx.beginPath();
                this.ctx.arc(posA.x, posA.y, posA.r, 0, 2 * Math.PI);
                this.ctx.fillStyle = setA.originalColor + '40';
                this.ctx.fill();
                
                this.ctx.beginPath();
                this.ctx.arc(posB.x, posB.y, posB.r, 0, 2 * Math.PI);
                this.ctx.fillStyle = setB.originalColor + '40';
                this.ctx.fill();
                
                this.ctx.beginPath();
                this.ctx.arc(posC.x, posC.y, posC.r, 0, 2 * Math.PI);
                this.ctx.fillStyle = setC.originalColor + '40';
                this.ctx.fill();
                
                this.ctx.restore();
            }
        }
    }

    updateRelationshipInfo() {
        const relationshipInfo = document.getElementById('relationshipInfo');
        
        if (this.sets.size < 2) {
            relationshipInfo.innerHTML = '';
            return;
        }
        
        const setsArray = Array.from(this.sets.values());
        
        if (this.sets.size === 2) {
            const setA = setsArray[0];
            const setB = setsArray[1];
            
            const hasIntersection = this.hasIntersection(setA, setB);
            const isASubsetOfB = this.isSubset(setA, setB);
            const isBSubsetOfA = this.isSubset(setB, setA);
            
            let message = '';
            if (!hasIntersection) {
                message = `<h4>Отношение: ${setA.name} ∩ ${setB.name} = ∅</h4><p>Множества не пересекаются</p>`;
            } else if (isASubsetOfB && isBSubsetOfA) {
                message = `<h4>Отношение: ${setA.name} = ${setB.name}</h4><p>Множества равны</p>`;
            } else if (isASubsetOfB) {
                message = `<h4>Отношение: ${setA.name} ⊆ ${setB.name}</h4><p>${setA.name} является подмножеством ${setB.name}</p>`;
            } else if (isBSubsetOfA) {
                message = `<h4>Отношение: ${setB.name} ⊆ ${setA.name}</h4><p>${setB.name} является подмножеством ${setA.name}</p>`;
            } else {
                const commonElements = this.getIntersection(setA, setB);
                message = `<h4>Отношение: ${setA.name} ∩ ${setB.name} ≠ ∅</h4><p>Множества пересекаются (${commonElements.size} общих элементов)</p>`;
            }
            
            relationshipInfo.innerHTML = message;
        } else if (this.sets.size === 3) {
            const relationship = this.determineThreeSetsRelationship(setsArray[0], setsArray[1], setsArray[2]);
            let message = `<h4>Тип отношений: Случай ${relationship.type}</h4>`;
            
            switch(relationship.type) {
                case 1:
                    message += `<p>Все три множества не пересекаются друг с другом</p>`;
                    break;
                case 2:
                    message += `<p>Пересекается только одна пара множеств: ${relationship.details.intersecting}</p>`;
                    break;
                case 3:
                    message += `<p>Цепочка пересечений: ${relationship.details.chain}. Не пересекаются: ${relationship.details.nonIntersecting}</p>`;
                    break;
                case 4:
                    message += `<p>Все три множества пересекаются друг с другом</p>`;
                    break;
                case 5:
                    const subset5 = relationship.details.subset;
                    const innerSet5 = subset5.split('_')[0];
                    const outerSet5 = subset5.split('_')[2];
                    message += `<p>${innerSet5} ⊆ ${outerSet5}, ${outerSet5} пересекается с третьим множеством</p>`;
                    break;
                case 6:
                    const subset6 = relationship.details.subset;
                    const innerSet6 = subset6.split('_')[0];
                    const outerSet6 = subset6.split('_')[2];
                    message += `<p>${innerSet6} ⊆ ${outerSet6}, и оба пересекаются с третьим множеством</p>`;
                    break;
            }
            
            relationshipInfo.innerHTML = message;
        } else {
            relationshipInfo.innerHTML = `<h4>Создано множеств: ${this.sets.size}</h4>`;
        }
    }

    updateElementInfo() {
        const elementList = document.getElementById('elementList');
        elementList.innerHTML = '';
        
        const allElements = new Map();
        
        this.sets.forEach(setData => {
            setData.elements.forEach(element => {
                if (!allElements.has(element)) {
                    allElements.set(element, []);
                }
                allElements.get(element).push(setData.name);
            });
        });
        
        if (allElements.size === 0) return;
        
        allElements.forEach((sets, element) => {
            const elementItem = document.createElement('div');
            elementItem.className = 'element-item';
            elementItem.innerHTML = `
                <span><strong>${element}</strong></span>
                <span>в ${sets.join(', ')}</span>
            `;
            elementList.appendChild(elementItem);
        });
    }

    drawLegend() {
        if (this.sets.size === 0) return;

        const legendX = this.canvas.width - 150;
        const legendY = 30;
        
        this.ctx.fillStyle = this.isDarkTheme ? 'rgba(30, 30, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)';
        this.ctx.strokeStyle = this.isDarkTheme ? '#555' : '#ccc';
        this.ctx.lineWidth = 1;
        
        this.ctx.fillRect(legendX - 10, legendY - 10, 140, this.sets.size * 25 + 20);
        this.ctx.strokeRect(legendX - 10, legendY - 10, 140, this.sets.size * 25 + 20);
        
        this.ctx.fillStyle = this.isDarkTheme ? '#e0e0e0' : '#333';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('Легенда:', legendX, legendY + 5);

        let yOffset = legendY + 25;
        this.sets.forEach((setData, setName) => {
            this.ctx.fillStyle = setData.originalColor;
            this.ctx.fillRect(legendX, yOffset - 10, 15, 15);
            
            this.ctx.fillStyle = this.isDarkTheme ? '#e0e0e0' : '#333';
            this.ctx.font = '12px Arial';
            this.ctx.fillText(`${setData.name}: ${setData.elements.length} эл.`, legendX + 25, yOffset);
            
            yOffset += 25;
        });
    }

    visualizeSets() {
        this.clearCanvas();
        
        if (this.sets.size === 0) {
            return;
        }

        this.calculateCirclePositions();
        this.drawIntersectionAreas();
        
        this.sets.forEach(setData => {
            const isSelected = this.selectedSets.has(setData.name);
            this.drawCircle(setData, isSelected);
        });
        
        if (this.showLabels) {
            this.sets.forEach(setData => {
                if (setData.elements.length <= 8) {
                    this.drawSetElements(setData);
                }
            });
        }
        
        this.drawLegend();
    }

    clearCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = this.isDarkTheme ? '#2d2d2d' : 'white';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    calculateIntersection() {
        if (this.selectedSets.size < 2) {
            alert('Выберите как минимум 2 множества для пересечения');
            return;
        }

        const selectedSetsArray = Array.from(this.selectedSets)
            .map(setName => this.sets.get(setName));
        
        let intersection = new Set(selectedSetsArray[0].elements);
        for (let i = 1; i < selectedSetsArray.length; i++) {
            intersection = new Set(
                [...intersection].filter(x => selectedSetsArray[i].elements.includes(x))
            );
        }
        
        const setNames = selectedSetsArray.map(s => s.name).join(' ∩ ');
        this.displayResult(`Пересечение множеств: ${setNames}`, intersection);
        this.highlightOperation('intersectionBtn');
        this.updateFormula(`\\bigcap_{i=1}^{${selectedSetsArray.length}} ${selectedSetsArray.map(s => s.name).join(' \\cap ')}`);
    }

    calculateUnion() {
        if (this.selectedSets.size === 0) {
            alert('Выберите хотя бы одно множество для объединения');
            return;
        }

        const selectedSetsArray = Array.from(this.selectedSets)
            .map(setName => this.sets.get(setName));
        
        const union = new Set();
        selectedSetsArray.forEach(set => {
            set.elements.forEach(element => union.add(element));
        });
        
        const setNames = selectedSetsArray.map(s => s.name).join(' ∪ ');
        this.displayResult(`Объединение множеств: ${setNames}`, union);
        this.highlightOperation('unionBtn');
        this.updateFormula(`\\bigcup_{i=1}^{${selectedSetsArray.length}} ${selectedSetsArray.map(s => s.name).join(' \\cup ')}`);
    }

    calculateDifference() {
        const setA = document.getElementById('differenceSetA').value;
        const setB = document.getElementById('differenceSetB').value;
        
        if (!setA || !setB) {
            alert('Выберите оба множества для разности');
            return;
        }

        const setAData = this.sets.get(setA);
        const setBData = this.sets.get(setB);
        
        const difference = new Set(
            setAData.elements.filter(x => !setBData.elements.includes(x))
        );
        
        this.displayResult(`Разность множеств: ${setA} \\ ${setB}`, difference);
        this.highlightOperation('differenceBtn');
        this.updateFormula(`${setA} \\setminus ${setB}`);
        
        this.selectedSets.clear();
        this.selectedSets.add(setA);
        this.selectedSets.add(setB);
        this.updateOperationSets();
        this.visualizeSets();
    }

    calculateSymmetricDifference() {
        const setA = document.getElementById('symmetricSetA').value;
        const setB = document.getElementById('symmetricSetB').value;
        
        if (!setA || !setB) {
            alert('Выберите оба множества для симметрической разности');
            return;
        }

        const setAData = this.sets.get(setA);
        const setBData = this.sets.get(setB);
        
        const diffAB = new Set(setAData.elements.filter(x => !setBData.elements.includes(x)));
        const diffBA = new Set(setBData.elements.filter(x => !setAData.elements.includes(x)));
        const symmetricDiff = new Set([...diffAB, ...diffBA]);
        
        this.displayResult(`Симметрическая разность: ${setA} △ ${setB}`, symmetricDiff);
        this.highlightOperation('symmetricBtn');
        this.updateFormula(`${setA} \\triangle ${setB}`);
        
        this.selectedSets.clear();
        this.selectedSets.add(setA);
        this.selectedSets.add(setB);
        this.updateOperationSets();
        this.visualizeSets();
    }

    displayResult(operation, resultSet) {
        const resultContent = document.getElementById('resultContent');
        const elements = Array.from(resultSet);
        
        resultContent.innerHTML = `
            <h4>${operation}</h4>
            <div class="result-set">
                { ${elements.join(', ') || '∅'} }
            </div>
            <p><strong>Мощность множества:</strong> ${resultSet.size} элементов</p>
            <p><strong>Элементы:</strong> ${elements.join(', ') || '∅ (пустое множество)'}</p>
        `;
        
        this.userSolution = resultSet;
    }

    updateFormula(latex) {
        const formulaDisplay = document.getElementById('formulaDisplay');
        formulaDisplay.innerHTML = `\\(${latex} = \\)`;
        this.renderMathExpressions();
    }

    renderMathExpressions() {
        if (typeof katex !== 'undefined') {
            const mathElements = document.querySelectorAll('.formula-display');
            mathElements.forEach(el => {
                const latex = el.textContent;
                if (latex) {
                    katex.render(latex.replace(/\\\(/g, '').replace(/\\\)/g, ''), el, {
                        throwOnError: false,
                        displayMode: true
                    });
                }
            });
        }
    }

    highlightOperation(buttonId) {
        document.querySelectorAll('.btn.secondary').forEach(btn => {
            btn.classList.remove('operation-active');
        });
        
        if (buttonId) {
            const button = document.getElementById(buttonId);
            button.classList.add('operation-active');
            setTimeout(() => {
                button.classList.remove('operation-active');
            }, 2000);
        }
    }

    clearResult() {
        document.getElementById('resultContent').innerHTML = 
            '<p>Выберите операцию для отображения результата</p>';
        document.getElementById('formulaDisplay').innerHTML = '';
        this.highlightOperation(null);
    }

    toggleTheme() {
        this.isDarkTheme = !this.isDarkTheme;
        document.body.classList.toggle('dark-theme', this.isDarkTheme);
        
        const themeIcon = document.querySelector('.theme-icon');
        themeIcon.textContent = this.isDarkTheme ? '☀️' : '🌙';
        
        localStorage.setItem('venn-theme', this.isDarkTheme ? 'dark' : 'light');
        
        this.visualizeSets();
        this.showNotification(`Тема переключена: ${this.isDarkTheme ? 'Тёмная' : 'Светлая'}`);
    }

    showNotification(message) {
        const container = document.getElementById('notificationContainer') || document.body;
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        
        container.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'fadeOut 0.5s ease';
            setTimeout(() => notification.remove(), 500);
        }, 2500);
    }

    clearAll() {
        if (confirm('Вы уверены, что хотите удалить все множества?')) {
            this.sets.clear();
            this.selectedSets.clear();
            this.circlePositions.clear();
            this.universalSet = null;
            this.updateUI();
            this.clearResult();
            this.updateCanvasDataAttribute();
            document.getElementById('setName').value = 'A';
            document.getElementById('setElements').value = '';
            this.showNotification('Все данные очищены');
        }
    }
}

// Инициализация приложения
const visualizer = new SetVisualizer();

// Адаптация размера canvas
function resizeCanvas() {
    const canvas = document.getElementById('vennCanvas');
    const container = canvas.parentElement;
    const newWidth = Math.min(800, container.clientWidth - 40);
    const newHeight = Math.min(600, newWidth * 0.75);
    
    if (canvas.width !== newWidth || canvas.height !== newHeight) {
        canvas.width = newWidth;
        canvas.height = newHeight;
        visualizer.visualizeSets();
    }
}

window.addEventListener('resize', resizeCanvas);
window.addEventListener('load', resizeCanvas);

// Добавляем стили для анимаций
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeInOut {
        0% { opacity: 0; transform: translateY(-20px); }
        20% { opacity: 1; transform: translateY(0); }
        80% { opacity: 1; transform: translateY(0); }
        100% { opacity: 0; transform: translateY(-20px); }
    }
    
    @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
    }
`;
document.head.appendChild(style);