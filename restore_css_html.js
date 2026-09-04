const fs = require('fs');
const lines = fs.readFileSync('C:/Users/truon/.gemini/antigravity-ide/brain/9dd3a190-53a1-40e3-a69d-be30afb9dbbb/.system_generated/logs/transcript_full.jsonl', 'utf8').split('\n').filter(Boolean);

const getStep = (idx) => {
    const s = lines.find(l => {
        try {
            const p = JSON.parse(l);
            return p.step_index === idx && p.tool_calls;
        } catch(e) { return false; }
    });
    return s ? JSON.parse(s) : null;
};

const s162 = getStep(162);
if (s162) {
    fs.writeFileSync('wildlife-guardian/SpeciesLibarary/css/SpeciesLibarary.css', s162.tool_calls[0].args.CodeContent);
    console.log("Restored CSS");
} else {
    console.log("Failed to find step 162");
}

const s181 = getStep(181);
if (s181) {
    fs.writeFileSync('wildlife-guardian/SpeciesLibarary/SpeciesLibarary.html', s181.tool_calls[0].args.CodeContent);
    console.log("Restored HTML");
} else {
    console.log("Failed to find step 181");
}
