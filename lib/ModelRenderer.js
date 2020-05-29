const colors = require('colors');

class ModelRenderer {

    static contains(oObj, sAttribute, sDefault = "") {
        return oObj[sAttribute] ? oObj[sAttribute] : sDefault
    }

    /**
     * Constructor of the ModelRenderer
     * @param {oObject} model the javascript object representation of the model
     */
    constructor(model) {
        this._model = model;
        this._addSelectInformation = false;
        this._linesDrawn = 0;
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

    _traverse(node, level = -1, print = false, childIndex = -1) {
        //startPrinting
        if (node.name === "struct") {
            level++;
            node.prefix = " ";
            node.children.forEach((subNode, index) => this._traverse(subNode, level, true, index));
            return
        }

        if (print) {
            if (!node.selected) {
                node.selected = ModelRenderer.contains(node.attributes, "mandatory", false) ? true : false;
            }

            let parentPrefix = this._createParentPrefix(node);
            let prefix = this._firstPrefix(node.parent.name === "alt", node.parent.children.length === 1, node.parent.children.length - 1 === childIndex);
            let selectField = this._addSelectInformation ? this._selectionField(node.parent.name === "alt", ModelRenderer.contains(node.attributes, "mandatory", false) || node.selected) : "";
            let featureName = ModelRenderer.contains(node.attributes, "name", "unnamed");
            let output = ModelRenderer.contains(node.attributes, "mandatory", undefined) ? colors.underline.cyan(featureName) : featureName;
            output = ModelRenderer.contains(node.attributes, "abstract", undefined) ? colors.gray(featureName) : output;


            let outputString = `${parentPrefix}${level!==0 ? prefix : ""}${level!==0 ? selectField : ""}${output}`;

            node.prefix = prefix;
            console.log(outputString);
            this._linesDrawn++;
        }

        if (level > -1) {
            level++;
        }
        node.children.forEach((subNode, index) => this._traverse(subNode, level === 0 ? 0 : level, print, index));
    }

    _markFeature(node, sFeatureName) {
        if (ModelRenderer.contains(node.attributes, "name", "") === sFeatureName) {
            node.selected = !node.selected;
            return true;
        }
        return node.children.map(child => this._markFeature(child, sFeatureName)).reduce((total, cur) => total || cur, false);
    }

    _getMarkedFeatures(node, bTreeReached) {
        //only start if we passed the struct node
        debugger;
        if (!node.selected && !bTreeReached) {
            if (node.name === "struct") {
                return node.children
                    .map(child => this._getMarkedFeatures(child, true))
                    .reduce((t, c) => typeof c === "string" ? [...t, c] : [...t, ...c], [])
                    .filter((item) => item.trim() !== '');
            } else {
                return node.children
                    .map(child => this._getMarkedFeatures(child))
                    .reduce((t, c) => typeof c === "string" ? [...t, c] : [...t, ...c], [])
                    .filter((item) => item.trim() !== '');
            }
            //only return features which are selected, just possible top down, stop if not selected
        } else if (node.selected && bTreeReached) {
            if (!ModelRenderer.contains(node.attributes, "abstract")) {
                return [
                        ModelRenderer.contains(node.attributes, "name", ""),
                        ...node.children
                        .map(child => this._getMarkedFeatures(child, bTreeReached))
                    ]
                    .reduce((t, c) => typeof c === "string" ? [...t, c] : [...t, ...c], [])
                    .filter((item) => item.trim() !== '');
            } else {
                return node.children
                    .map(child => this._getMarkedFeatures(child, bTreeReached))
                    .reduce((t, c) => typeof c === "string" ? [...t, c] : [...t, ...c], [])
                    .filter((item) => item.trim() !== '');
            }
        } else {
            return "";
        }
    }

    markFeatureSelected(sFeatureName) {
        return this._markFeature(this._model, sFeatureName);
    }

    showSelected(bShow = false) {
        this._addSelectInformation = bShow;
    }

    render() {
        if (this._linesDrawn !== 0) {
            process.stdout.moveCursor(0, -this._linesDrawn);
            this._linesDrawn = 0;
        }
        this._traverse(this._model);
    };

    addAdditionalWritenLinesToClear(iNumber = 0) {
        this._linesDrawn += iNumber;
    }

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

        console.log(sMandatory);
        console.log(sAbstract);
        console.log(sOptional);
        console.log(sAlternative);
    }

    getSelectedFeatures() {
        return this._getMarkedFeatures(this._model);
    }
}

module.exports = ModelRenderer;