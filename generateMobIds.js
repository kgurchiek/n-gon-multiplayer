const fs = require('fs');
const writeStream = fs.createWriteStream('./mobIdWrappers.js');
eval(fs.readFileSync('./mobs.js').toString());
// console.log(Object.keys(mobs).length);
const mobNames = [];
let index = 0;
for (const func in mobs) {
    if (mobs[func].toString().includes('mobs.spawn(')) {
        const oldName = mobs[func].name;
        mobNames.push(oldName);
        const newName = `old${mobs[func].name[0].toUpperCase()}${mobs[func].name.substring(1)}`;
        const args = mobs[func].toString().substring(mobs[func].toString().indexOf('('), mobs[func].toString().indexOf(') {') + 1);
        // console.log(args)
        let strictArgs = '(';
        for (const arg of args.substring(1, args.length - 1).split(', ')) {
            const newArg = arg.includes('=') ? arg.substring(0, arg.indexOf(' =')) : arg;
            strictArgs += strictArgs.length == 1 ? newArg : `, ${newArg}`;
        }
        strictArgs += ')';
        // console.log(strictArgs)
        writeStream.write(
            `const ${newName} = spawn.${oldName};
            spawn.${oldName} = ${args} => {
                ${newName}${strictArgs};
                mob[mob.length - 1].mobType = ${index};
            }
            
            `
        )
        index++;
    }
}
console.log(`['${mobNames.join("', '")}']`);