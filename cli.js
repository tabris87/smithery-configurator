const program = require('commander');
const commands = require('./commands');
const packageInfo = require('./package.json');

const run = oProcess => {
    program.version(packageInfo.version);

    Object.keys(commands).forEach(key => commands[key].createCommand(program));
    program.parse(oProcess.argv);
}

module.exports = {
    run
};