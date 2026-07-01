const { GoogleGenAI } = require('@google/genai');

// Initialize the Gemini client using the environment variable
const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

exports.handler = async function(event, context) {
    // Enable CORS handling for incoming requests
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

        // Agent 1: The UI/UX Expert
        const uiUxAgentTask = ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `System Role: You are an elite UI/UX Design Auditor. Analyze the provided URL. Call out interface friction, mobile responsiveness issues, layout inconsistencies, and accessibility barriers. Keep the analysis direct, actionable, and formatted with clear bullet points.\n\nPerform a design friction audit on this corporate web application property: ${url}`
        });

        // Agent 2: The Technical Expert
        const technicalAgentTask = ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `System Role: You are a Senior Full-Stack Architect. Analyze the provided URL. Diagnose potential production bottlenecks, database connectivity risks, core web vitals, security gaps, and foundational SEO structure errors. Keep your advice technically accurate and developer-focused.\n\nPerform a technical structural audit on this corporate web application property: ${url}`
        });

        // Orchestrator Synchronization Layer (Awaiting both tasks to resolve concurrently)
        const [uiUxResult, technicalResult] = await Promise.all([uiUxAgentTask, technicalAgentTask]);

        // Orchestrator Consolidation Strategy
        const finalCompiledReport = `==================================================
🛡️ AUTOMATED AUDIT DISPATCH REPORT
==================================================

[AGENT 1: UI/UX USER INTERFACE EXPERT DISPATCHED]
${uiUxResult.text}

--------------------------------------------------

[AGENT 2: FULL-STACK TECHNICAL ARCHITECT DISPATCHED]
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