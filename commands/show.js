"use strict";
const {
    ModelInternal
} = require('smithery-equipment');
const ModelRenderer = require('../lib/ModelRenderer');

const showFeatureModel = model => {
    /* reader.on("done", data => {
        let renderer = new ModelRenderer(data);

        renderer.render();
        renderer.showLegend();
        process.exit();
    });

    fs.readFile(model, {
        encoding: 'UTF-8'
    }, (err, data) => {
        if (err) throw err;
        reader.parse(data);
    }) */

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