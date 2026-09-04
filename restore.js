const fs = require('fs');
const lines = fs.readFileSync('C:/Users/truon/.gemini/antigravity-ide/brain/9dd3a190-53a1-40e3-a69d-be30afb9dbbb/.system_generated/logs/transcript_full.jsonl', 'utf8').split('\n').filter(Boolean);
let js = fs.readFileSync('wildlife-guardian/SpeciesLibarary/js/SpeciesLibarary.js', 'utf8');

const getStep = (idx) => {
    const s = lines.find(l => {
        try {
            const p = JSON.parse(l);
            return p.step_index === idx && p.tool_calls;
        } catch(e) { return false; }
    });
    return s ? JSON.parse(s) : null;
};

const steps = [125, 131, 145, 183];
steps.forEach(sIdx => {
    const p = getStep(sIdx);
    if (!p) return;
    const args = p.tool_calls[0].args;
    const chunks = args.ReplacementChunks || [args];
    chunks.forEach(c => {
        if(c.TargetContent && c.ReplacementContent) {
            js = js.replace(c.TargetContent, c.ReplacementContent);
        }
    });
});
fs.writeFileSync('wildlife-guardian/SpeciesLibarary/js/SpeciesLibarary.js', js);
console.log('Restored JS completely to Version 1!');
