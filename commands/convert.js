"use strict";

const {
    ModelInternal,
    ModelConverter
} = require('smithery-equipment');

const showCNF = (model, cmdObj) => {
    ModelInternal.readModelFile(model).then(oModel => {
        let converter = new ModelConverter(oModel);
        console.log(`${model}\n`);
        console.log(converter.getCNFString(cmdObj.dimacs, cmdObj.text));
        process.exit(0);
    }).catch(err => {
        console.log(err);
        process.exit(1);
    })
}

module.exports = {
    createCommand: program => {
        program.command('convert') //sub-command name
            .alias('C')
            .description('Shows a given feature model.')
            .arguments('<model>')
            .option('-d, --dimacs', 'convert to dimacs')
            .option('-t, --text', 'Show the feature name instead of the id')
            .option('-s, --show', 'show the cnf')
            .action(showCNF)
    }
}