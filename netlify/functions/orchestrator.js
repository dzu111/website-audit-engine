const { OpenAI } = require('openai');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY 
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

        // Initialize parallel execution channels across specialized agents
        const uiUxAgentTask = openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { 
                    role: "system", 
                    content: "You are an elite UI/UX Design Auditor. Analyze the provided URL. Call out interface friction, mobile responsiveness issues, layout inconsistencies, and accessibility barriers. Keep the analysis direct, actionable, and formatted with clear bullet points." 
                },
                { role: "user", content: `Perform a design friction audit on this corporate web application property: ${url}` }
            ]
        });

        const technicalAgentTask = openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { 
                    role: "system", 
                    content: "You are a Senior Full-Stack Architect. Analyze the provided URL. Diagnose potential production bottlenecks, database connectivity risks, core web vitals, security gaps, and foundational SEO structure errors. Keep your advice technically accurate and developer-focused." 
                },
                { role: "user", content: `Perform a technical structural audit on this corporate web application property: ${url}` }
            ]
        });

        // Orchestrator Synchronization Layer (Awaiting both tasks to resolve)
        const [uiUxResult, technicalResult] = await Promise.all([uiUxAgentTask, technicalAgentTask]);

        const uiUxReport = uiUxResult.choices[0].message.content;
        const technicalReport = technicalResult.choices[0].message.content;

        // Orchestrator Consolidation Strategy
        const finalCompiledReport = `==================================================
🛡️ AUTOMATED AUDIT DISPATCH REPORT
==================================================

[AGENT 1: UI/UX USER INTERFACE EXPERT DISPATCHED]
${uiUxReport}

--------------------------------------------------

[AGENT 2: FULL-STACK TECHNICAL ARCHITECT DISPATCHED]
${technicalReport}

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