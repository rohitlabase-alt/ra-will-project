const fs = require('fs');
const log = fs.readFileSync('C:/Users/rohit/.gemini/antigravity/brain/d27c1edd-548f-4f5d-a126-5710c32205ea/.system_generated/logs/overview.txt', 'utf8');

const lines = log.split('\n');
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('VIEW_FILE') && line.includes('App.tsx')) {
     try {
       const data = JSON.parse(line);
       console.log('Found VIEW_FILE App.tsx at step', data.step_index);
       const content = data.content;
       if (content.length > 50000) {
           console.log('Length:', content.length);
           fs.writeFileSync('src/App_backup_step_' + data.step_index + '.tsx', content);
       }
     } catch (e) {}
  }
}
console.log('Done');
