const https = require('https');
const fs = require('fs');
const path = require('path');

// Read .env.local to get the key manually since we can't depend on dotenv
try {
    const envPath = path.resolve(__dirname, '../.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/GOOGLE_GENERATIVE_AI_API_KEY=(.+)/);

    if (!match) {
        console.error('Error: GOOGLE_GENERATIVE_AI_API_KEY not found in .env.local');
        process.exit(1);
    }

    const apiKey = match[1].trim();

    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

    console.log('Fetching available models from Google AI...');

    https.get(url, (res) => {
        let data = '';

        res.on('data', (chunk) => {
            data += chunk;
        });

        res.on('end', () => {
            if (res.statusCode !== 200) {
                console.error(`Error: API Request failed with status code ${res.statusCode}`);
                console.error('Response:', data);
                return;
            }

            try {
                const json = JSON.parse(data);
                if (json.models) {
                    console.log('\n✅ AVAILABLE MODELS:');
                    json.models.forEach(model => {
                        // Filter for generateContent supported models
                        if (model.supportedGenerationMethods.includes('generateContent')) {
                            console.log(`- ${model.name.replace('models/', '')}`);
                        }
                    });
                } else {
                    console.log('No models found in response.');
                }
            } catch (e) {
                console.error('Error parsing JSON:', e.message);
            }
        });

    }).on('error', (err) => {
        console.error('Network Error:', err.message);
    });

} catch (err) {
    console.error('Error reading .env.local:', err.message);
}
