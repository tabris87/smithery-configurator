"use strict";
const fs = require('fs');
const path = require('path');
const xmlReader = require('xml-reader');
const reader = xmlReader.create();
const colors = require('colors');
const ModelRenderer = require('../lib/ModelRenderer');
const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

let renderer;

const writeConfiguration = (aFeatures, sPath) => {
    const questionName = () => {
        rl.question('How do want to call it? ', answer => {
            if (answer !== "") {
                let aSelectedFeatures = renderer.getSelectedFeatures();
                console.log(`${colors.bold.underline(answer.toUpperCase())}: ${aSelectedFeatures}`);

                let stOutput = fs.createWriteStream(path.join(sPath, `${answer}.config`));
                aFeatures.forEach(sFeature => {
                    stOutput.write(`${sFeature}\n`)
                });
                stOutput.end();
                console.log('Finished!');
                rl.close();
                process.exit();
            } else {
                console.log(colors.red("Please provide a configuration name"));
                rl.question(questions["configName"].text, questions["configName"].callback);
            }
        })
    }

    const questionWrite = () => {
        rl.question('Do you want to write the configuration? (y/N)', (answer = "N") => {
            if (answer.toUpperCase() === "N" || answer === "") {
                rl.close();
                process.exit();
            } else {
                questionName();
            }
        })
    }

    questionWrite();
}

const showFeatureModel = (model, sPath = './') => {
    reader.on("done", data => {
        renderer = new ModelRenderer(data);
        renderer.showSelected(true);
        renderer.render();
        const ask = () => {
            rl.question('Mark/Unmark a feature by typing the name (:q for finishing configuration): ',
                answer => {
                    if (answer === ":q") {
                        writeConfiguration(renderer.getSelectedFeatures(), sPath);
                    } else {
                        let marked = renderer.markFeatureSelected(answer);
                        if (marked) {
                            renderer.addAdditionalWritenLinesToClear(1);
                            renderer.render();
                            ask()
                        } else {
                            console.log("Sry the feature cannot be found! Did you misspelled it?");
                            renderer.addAdditionalWritenLinesToClear(2);
                            ask();
                        }
                    }
                });
        }
        ask();
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
        program.command('configure') //sub-command name
            .alias('C')
            .description('Opens the model to create a configuration')
            .arguments('<model> [storingPath]')
            .action(showFeatureModel)
    }
}