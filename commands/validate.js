"use strict";

const {
    ModelInternal,
    ModelConverter
} = require('smithery-equipment');

const Logic = require('logic-solver');

const validate = (model) => {
    ModelInternal.readModelFile(model).then(oModel => {
        let converter = new ModelConverter(oModel);
        let aClauses = converter.getCNFClauses();
        let oModelFormula = Logic.and(aClauses.map(aCL => Logic.or(aCL.map(oV => oV.getName()))));
        let oSolver = new Logic.Solver;
        oSolver.require(oModelFormula);

        //simple test for using the solver and add additional contraints to check for validity
        var oSolution = oSolver.solve();
        console.log(oSolution.getTrueVars());
        console.log(oSolution.getMap());
        console.log(oSolution.getFormula());
        console.log(oSolution.getFormula().operands.map(t => oSolver.toNameTerm(t)));
        debugger;
        console.log(oSolver.solveAssuming(oSolution.getFormula()).getTrueVars());
        debugger;
        process.exit(0);
    }).catch(err => {
        console.log(err);
        process.exit(1);
    })
}

module.exports = {
    createCommand: program => {
        program.command('validate') //sub-command name
            .alias('C')
            .description('Shows a given feature model.')
            .arguments('<model>')
            .action(validate)
    }
}