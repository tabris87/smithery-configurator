"use strict";
const {
    ModelInternal
} = require('smithery-equipment');
const ModelRenderer = require('../lib/ModelRenderer');

const showFeatureModel = model => {
    ModelInternal.readModelFile(model).then(oModel => {
        let renderer = new ModelRenderer(oModel);
        renderer.render();
        renderer.showLegend();
        process.exit(0);
    }).catch(err => {
        console.log(err);
        process.exit(1);
    })
}

module.exports = {
    createCommand: program => {
        program.command('show') //sub-command name
            .alias('S')
            .description('Shows a given feature model.')
            .arguments('<model>')
            .action(showFeatureModel)
    }
}