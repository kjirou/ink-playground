const logUpdate = require('log-update');
const frames = ['-', '\\', '|', '/'];
let i = 0;

setInterval(() => {
  const frame = frames[i = ++i % frames.length];

  logUpdate(
`
        ♥♥
   ${frame} unicorns ${frame}
        ♥♥
`
  );
}, 80);
