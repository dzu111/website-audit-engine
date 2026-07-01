const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

exports.handler = async function(event, context) {
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Methods": "POST, OPTIONS"
            },
            body: JSON.stringify({ message: "Ready" })
        };
    }

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    try {
        const { url } = JSON.parse(event.body);
        if (!url) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Target URL is required' }) };
        }

        // Agent 1: The UI/UX Expert (Constrained for speed)
        const uiUxAgentTask = ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `You are an elite UI/UX Design Auditor. Analyze the provided URL and list interface friction or mobile responsiveness issues. Keep it to exactly 3 short bullet points. URL: ${url}`,
            config: {
                maxOutputTokens: 150,
                temperature: 0.4
            }
        });

        // Agent 2: The Technical Expert (Constrained for speed)
        const technicalAgentTask = ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `You are a Senior Full-Stack Architect. Analyze the provided URL for potential performance bottlenecks or SEO errors. Keep it to exactly 3 short bullet points. URL: ${url}`,
            config: {
                maxOutputTokens: 150,
                temperature: 0.4
            }
        });

        // Orchestrator Synchronization Layer
        const [uiUxResult, technicalResult] = await Promise.all([uiUxAgentTask, technicalAgentTask]);

        const finalCompiledReport = `==================================================
🛡️ AUTOMATED AUDIT DISPATCH REPORT
==================================================

[AGENT 1: UI/UX USER INTERFACE EXPERT]
${uiUxResult.text}

--------------------------------------------------

[AGENT 2: FULL-STACK TECHNICAL ARCHITECT]
${technicalResult.text}

==================================================
End of Orchestrated Execution Pipeline.`;

        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            },
            body: JSON.stringify({ auditReport: finalCompiledReport })
        };

    } catch (error) {
        console.error("Orchestrator error caught:", error);
        return {
            statusCode: 500,
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({ error: 'Failed to orchestrate target agents.', details: error.message })
        };
    }
};
