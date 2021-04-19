const json = '{	"dice1": {"x": 365,"y": 120,"pip": 2},"dice2": {"x": 120,"y": 120,"pip": 2}';
var fs = require('fs');
fs.writeFile('dice.json',json,'utf8',function() {
    
});