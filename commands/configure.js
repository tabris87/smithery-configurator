"use strict";
const colors = require('colors');
const {
    ModelInternal
} = require('smithery-equipment');

const ModelRenderer = require('../lib/ModelRenderer');
const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

let renderer;
let linesWritten = 0;

const writeConfiguration = (aFeatures, sPath) => {
    const questionName = () => {
        rl.question('How do want to call it? ', answer => {
            if (answer !== "") {
                let stOutput = fs.createWriteStream(path.join(sPath, `${answer}.config`));

                stOutput.on('finish', () => {
                    console.log('Finished!');
                    rl.close();
                    process.exit();
                })
                aFeatures.forEach((sFeature, iIndex, aArr) => {
                    iIndex === (aArr.length - 1) ?
                        stOutput.write(`${sFeature}`) :
                        stOutput.write(`${sFeature}\n`);
                });
                stOutput.end();
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

const clearLines = () => {
    process.stdout.moveCursor(0, -linesWritten);
    linesWritten = 0;
}

const showFeatureModel = (model, sPath = './') => {
    ModelInternal.readModelFile(model).then(oModel => {
        renderer = new ModelRenderer(oModel);
        renderer.showSelected(true);
        linesWritten = renderer.render();
        const ask = () => {
            rl.question('Mark/Unmark a feature by typing the name (:q for finishing configuration, :l for the legend): ',
                answer => {
                    if (answer === ":q") {
                        let aSelectedFeatures = renderer.getSelectedFeatures();
                        console.log(`\n${colors.underline('Selected features:')} ${colors.underline(aSelectedFeatures)}\n`);
                        writeConfiguration(aSelectedFeatures, sPath);
                    } else if (answer === ":l") {
                        linesWritten += 1;
                        clearLines();
                        linesWritten = renderer.render();
                        linesWritten += renderer.showLegend();
                        ask()
                    } else {
                        let marked = renderer.markFeatureSelected(answer);
                        if (marked) {
                            linesWritten += 1;
                            clearLines();
                            linesWritten = renderer.render();
                            ask()
                        } else {
                            console.log("Sry the feature cannot be found/selected! Did you misspelled it?");
                            linesWritten += 2;
                            ask();
                        }
                    }
                });
        }
        ask();
    }).catch(err => {
        console.log(err);
        process.exit(1);
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