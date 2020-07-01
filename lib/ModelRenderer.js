const colors = require('colors');
const {
    ModelInternal,
    ModelConverter
} = require('smithery-equipment');

const Logic = require('logic-solver');

class ModelRenderer {

    /**
     * Constructor of the ModelRenderer
     * @param {oObject} model the javascript object representation of the model
     */
    constructor(model) {
        this._oFeatureTree = model.getFeatureTree();
        this._model = model;
        this._addSelectInformation = false;
        this._linesDrawn = 0;
        let converter = new ModelConverter(model);
        let aClauses = converter.getCNFClauses();
        let oModelFormula = Logic.and(aClauses.map(aCL => Logic.or(aCL.map(oV => oV.getName()))));
        this._oSolver = new Logic.Solver;
        this._oSolver.require(oModelFormula);
    }

    _firstPrefix(bAlt, bOnly, bLastIndex) {
        if (bAlt) {
            if (bOnly || bLastIndex) {
                return String.fromCharCode(9562); //"╚"
            } else {
                return String.fromCharCode(9568); //"⊫"
            }
        } else {
            if (bOnly || bLastIndex) {
                return String.fromCharCode(9492) //"˪"
            } else {
                return String.fromCharCode(9500) //"⊢"
            }
        }
    }

    _selectionField(bAlt, bMandatory) {
        if (bAlt) {
            if (bMandatory) {
                return colors.green('(0)');
            } else {
                return colors.red('( )');
            }
        } else {
            if (bMandatory) {
                return colors.green('|X|');
            } else {
                return colors.red('| |');
            }
        }
    }

    _createParentPrefix(node) {
        if (node.parent) {
            let sParentPrefix = this._createParentPrefix(node.parent);

            let sCurPrefix = node.parent.prefix;

            switch (sCurPrefix) {
                case String.fromCharCode(9562):
                    sCurPrefix = " ";
                    break;
                case String.fromCharCode(9492):
                    sCurPrefix = " ";
                    break;
                case String.fromCharCode(9568):
                    sCurPrefix = String.fromCharCode(9553);
                    break;
                case String.fromCharCode(9500):
                    sCurPrefix = "|";
                    break;
                default:
                    sCurPrefix = sCurPrefix;
            }

            return sParentPrefix + (sCurPrefix ? sCurPrefix : "");
        } else {
            return "";
        }
    }

    _traverse(node, level = 0, childIndex = -1) {
        node.prefix = " ";
        if (typeof node.selected === "undefined") {
            node.selected = false;
        }
        if (ModelInternal.contains(node.attributes, "mandatory")) {
            if (level === 1) {
                node.selected = true;
            } else {
                let par = node.parent;
                while (par && ModelInternal.contains(par.attributes, "abstract")) {
                    par = par.parent;
                }
                node.selected = par ? par.selected : false;
            }
        }

        if (typeof node.selectable === "undefined") {
            node.selectable = ModelInternal.contains(node.attributes, "abstract") ? false : true;
        }

        let parentPrefix = this._createParentPrefix(node);
        let prefix = node.parent ? this._firstPrefix(node.parent.name === "alt", node.parent.children.length === 1, node.parent.children.length - 1 === childIndex) : node.prefix;
        let selectField = "";
        if (this._addSelectInformation) {
            selectField = node.selectable ? this._selectionField(node.parent.name === "alt", node.selected) : "";
        }

        let featureName = ModelInternal.contains(node.attributes, "name", "unnamed");
        let output = ModelInternal.contains(node.attributes, "mandatory", undefined) ? colors.underline.cyan(featureName) : featureName;
        output = ModelInternal.contains(node.attributes, "abstract", undefined) ? colors.grey(featureName) : output;

        let outputString = `${parentPrefix}${level!==0 ? prefix : ""}${level!==0 ? selectField : ""}${output}`;

        node.prefix = prefix;
        console.log(`${outputString}        `);
        this._linesDrawn++;
        level++;
        node.children.forEach((subNode, index) => this._traverse(subNode, level === 0 ? 0 : level, index));
    }

    _disableNodes(node, bSelectable = false) {
        if (!ModelInternal.contains(node.attributes, "abstract")) {
            node.selectable = bSelectable;
        }
        node.children.forEach(child => this._disableNodes(child, bSelectable));
    }

    _markFeature(node, sFeatureName) {
        if (ModelInternal.contains(node.attributes, "name", "") === sFeatureName && node.selectable) {
            node.selected = !node.selected;
            if (node.parent && node.parent.name === "alt") {
                node.parent.children
                    .filter(child => ModelInternal.contains(node.attributes, "name", "") !== ModelInternal.contains(child.attributes, "name", ""))
                    .forEach(child => this._disableNodes(child, !node.selected));
            }
            return true;
        }
        return node.children.map(child => this._markFeature(child, sFeatureName)).reduce((total, cur) => total || cur, false);
    }

    _getSolution(oNode) {
        //root node case
        if (ModelInternal.contains(oNode.attributes, "abstract", false) && typeof oNode.parent === "undefined") {
            return [
                    ModelInternal.contains(oNode.attributes, "name", ""),
                    ...oNode.children.map(oChild => this._getSolution(oChild))
                ]
                .reduce((t, c) => typeof c === "string" ? [...t, c] : [...t, ...c], [])
                .filter((item) => item.trim() !== '');
            //abstract node within an alternative
        } else if (ModelInternal.contains(oNode.attributes, "abstract", false) && typeof oNode.parent !== "undefined" && oNode.parent.selected && oNode.parent.name === "alt") {
            return [
                    ModelInternal.contains(oNode.attributes, "name", ""),
                    ...oNode.children.map(oChild => this._getSolution(oChild))
                ]
                .reduce((t, c) => typeof c === "string" ? [...t, c] : [...t, ...c], [])
                .filter((item) => item.trim() !== '');
            //normal selectable node 
        } else if (ModelInternal.contains(oNode.attributes, "abstract", false) &&
            typeof oNode.parent !== "undefined" &&
            !oNode.parent.selected &&
            ModelInternal.contains(oNode.parent.attributes, "abstract", false) &&
            ModelInternal.contains(oNode.attributes, "mandatory", false)) {
            return [
                    ModelInternal.contains(oNode.attributes, "name", ""),
                    ...oNode.children.map(oChild => this._getSolution(oChild))
                ]
                .reduce((t, c) => typeof c === "string" ? [...t, c] : [...t, ...c], [])
                .filter((item) => item.trim() !== '');
            //normal selectable node 
        } else if (
            ModelInternal.contains(oNode.attributes, "abstract", false) &&
            ModelInternal.contains(oNode.attributes, "mandatory", false) &&
            typeof oNode.parent !== "undefined" &&
            oNode.parent.selected &&
            !ModelInternal.contains(oNode.parent.attributes, "abstract", false)) {
            return [
                    ModelInternal.contains(oNode.attributes, "name", ""),
                    ...oNode.children.map(oChild => this._getSolution(oChild))
                ]
                .reduce((t, c) => typeof c === "string" ? [...t, c] : [...t, ...c], [])
                .filter((item) => item.trim() !== '');
            //normal selectable node 
        } else if (oNode.selected && !ModelInternal.contains(oNode.attributes, "abstract", false)) {
            return [
                    ModelInternal.contains(oNode.attributes, "name", ""),
                    ...oNode.children.map(oChild => this._getSolution(oChild))
                ]
                .reduce((t, c) => typeof c === "string" ? [...t, c] : [...t, ...c], [])
                .filter((item) => item.trim() !== '');
            //node is not selected, therefore we can stop here
        } else {
            return [];
        }
    }

    _getMarkedFeatures(node) {
        if (node.selected && !ModelInternal.contains(node.attributes, "abstract", false)) {
            return [
                    ModelInternal.contains(node.attributes, "name", ""),
                    ...node.children.map(child => this._getMarkedFeatures(child))
                ]
                .reduce((t, c) => typeof c === "string" ? [...t, c] : [...t, ...c], [])
                .filter((item) => item.trim() !== '');
        } else {
            return node.children
                .map(child => this._getMarkedFeatures(child))
                .reduce((t, c) => typeof c === "string" ? [...t, c] : [...t, ...c], [])
                .filter((item) => item.trim() !== '');
        }
    }

    markFeatureSelected(sFeatureName) {
        return this._markFeature(this._oFeatureTree, sFeatureName);
    }

    showSelected(bShow = false) {
        this._addSelectInformation = bShow;
    }

    render() {
        this._linesDrawn = 0;
        this._traverse(this._oFeatureTree);

        //since here we only show if the current selection is valid or not
        let aTrueValues = this._getSolution(this._oFeatureTree);
        const trav = oNode => {
            var aFeatures = [ModelInternal.contains(oNode.attributes, "name", "unnamed")];
            return aFeatures.concat(...oNode.children.map(trav));
        }

        let aPattern = trav(this._oFeatureTree).map(sName => aTrueValues.includes(sName) ? sName : `-${sName}`);
        let oSomething = this._oSolver.solveAssuming(Logic.and(aPattern));
        console.log(`SelectedValues: ${aTrueValues}`)
        this._linesDrawn++;

        if (oSomething) {
            console.log(colors.green('The current selection is correct.                    '))
        } else {
            console.log(colors.red('The current selection is incorrect.                    '))
        }
        this._linesDrawn++;
        //return 
        return this._linesDrawn;
    };

    showLegend() {
        console.log('\n');
        const sMandatory = `Mandatory:   ${colors.cyan.underline('<FeatureName>')}`;
        const sAbstract = `Abstract:    ${colors.gray('<FeatureName>')}`;
        const sOptional = this._addSelectInformation ?
            `Optional:    '${String.fromCharCode(9492)}','${String.fromCharCode(9500)}' - ${colors.red('| |')} <- unselected, ${colors.green('|X|')} <- selected` :
            `Optional:    '${String.fromCharCode(9492)}','${String.fromCharCode(9500)}'`
        const sAlternative = this._addSelectInformation ?
            `Alternative: '${String.fromCharCode(9562)}','${String.fromCharCode(9568)}' - ${colors.red('( )')} <- unselected, ${colors.green('(0)')} <- selected` :
            `Alternative: '${String.fromCharCode(9562)}','${String.fromCharCode(9568)}'`;

        const sExplanation = 'If no selection field is shown the option is not selectable';

        console.log(sMandatory);
        console.log(sAbstract);
        console.log(sOptional);
        console.log(sAlternative);
        if (this._addSelectInformation) {
            console.log(colors.yellow(sExplanation));
        }
        return 7;
    }

    getSelectedFeatures() {
        return this._getMarkedFeatures(this._oFeatureTree);
    }
}

module.exports = ModelRenderer;