"use strict";
const fs = require('fs');
const xmlReader = require('xml-reader');
const reader = xmlReader.create();
const ModelRenderer = require('../lib/ModelRenderer');

const showFeatureModel = model => {
    reader.on("done", data => {
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