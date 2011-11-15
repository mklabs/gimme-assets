
var open = require('./docs').open;

module.exports = gimme;
gimme.usage = "gimme gimme gimme";
gimme.complete = function(o, cb) {
  return cb(null, ['gimme']);
};

var singnow = [
  "Half past twelve",
  "And I'm watching the late show in my flat all alone",
  "How I hate to spend the evening on my own",
  "Autumn winds",
  "Blowing outside my window as I look around the room",
  "And it makes me so depressed to see the gloom",
  "Is there a man out there",
  "Someone to hear my prays",
  "",
  "",
  "Gimme gimme gimme a man after midnight",
  "Won't somebody help me chase the shadows away",
  "Gimme gimme gimme a man after midnight",
  "Take me through the darkness to the break of the day",
  "",
  "Movie stars",
  "Find the end of the rainbow, with a fortune to win",
  "It's so different from the world I'm living in",
  "Tired of T.V.",
  "I open the window and I gaze into the night",
  "But there's nothing there to see, no one in sight",
  "Is there a man out there",
  "Someone to hear my prays",
  "",
  "Gimme gimme gimme a man after midnight",
  "Won't somebody help me chase the shadows away",
  "Gimme gimme gimme a man after midnight",
  "Take me through the darkness to the break of the day",
  "",
  "Gimme gimme gimme a man after midnight...",
  "Gimme gimme gimme a man after midnight...",
  "",
  "Is there a man out there",
  "Someone to hear my prays",
  "",
  "Gimme gimme gimme a man after midnight",
  "Won't somebody help me chase the shadows away",
  "Gimme gimme gimme a man after midnight",
  "Take me through the darkness to the break of the day",
  "Gimme gimme gimme a man after midnight",
  "Won't somebody help me chase the shadows away",
  "Gimme gimme gimme a man after midnight",
  "Take me through the darkness to the break of the day",
  "",
  "",
  "..."
];

function gimme(opts, cb) {

  var remains = opts.argv.remain,
    ln = remains.length;

  remains = remains.filter(function(item) {
    return item === 'gimme';
  });

  if(remains.length < 2 || remains.length !== ln) return cb('Nothing to give you sorry. Maybe `gimme gimme gimme`');

  console.log('\n\n       Then sing now! \n\n\n');
  console.log(singnow.join('\n'));
  open('http://www.youtube.com/watch?v=RLtU7aOnp2U', cb);
}
