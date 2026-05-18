const fs = require('fs');

const log = fs.readFileSync('C:/Users/rohit/.gemini/antigravity/brain/d27c1edd-548f-4f5d-a126-5710c32205ea/.system_generated/logs/overview.txt', 'utf8');

const fileLines = log.split('\n');
let reconstructedApp = {}; // Map of line number to content

for (let i = 0; i < fileLines.length; i++) {
    const rawLine = fileLines[i];
    if (!rawLine.trim()) continue;
    
    try {
        const data = JSON.parse(rawLine);
        if (data.content) {
            const contentLines = data.content.split('\n');
            let isRecording = false;
            
            for (const line of contentLines) {
                if (line.match(/^Showing lines \d+ to \d+$/) || line.startsWith('The following code has been modified')) {
                    isRecording = true;
                    continue;
                }
                
                if (isRecording && line.startsWith('The above content')) {
                    isRecording = false;
                    continue;
                }
                
                if (isRecording) {
                    const match = line.match(/^(\d+): (.*)$/);
                    if (match) {
                        reconstructedApp[parseInt(match[1], 10)] = match[2];
                    } else if (line.match(/^(\d+):$/)) {
                        reconstructedApp[parseInt(line.match(/^(\d+):$/)[1], 10)] = '';
                    } else if (line.match(/^<truncated /)) {
                        isRecording = false;
                    }
                }
            }
        }
    } catch(e) {}
}

const maxLine = Math.max(...Object.keys(reconstructedApp).map(Number));
let result = [];
for (let i = 1; i <= maxLine; i++) {
    result.push(reconstructedApp[i] !== undefined ? reconstructedApp[i] : `// MISSING LINE ${i}`);
}

fs.writeFileSync('src/App_reconstructed.tsx', result.join('\n'));
console.log(`Reconstructed ${Object.keys(reconstructedApp).length} lines, up to line ${maxLine}`);
