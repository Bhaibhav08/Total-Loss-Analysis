require("dotenv").config();

const AAVA_API_BASE_URL = process.env.AAVA_API_BASE_URL || "https://int-ai.aava.ai";
const AAVA_PIPELINE_ID = process.env.AAVA_PIPELINE_ID || "21773";
const AAVA_USER_EMAIL = process.env.AAVA_USER_EMAIL || "bhaibhav.raj@ascendion.com";
const AAVA_REALM_ID = process.env.AAVA_REALM_ID || "32";
const AAVA_BEARER_TOKEN = process.env.AAVA_BEARER_TOKEN || "";

const fs = require("fs");
const path = require("path");

async function testWorkflow() {
    const csvPath = path.join(__dirname, "data", "inventory.csv");
    const csvContent = fs.readFileSync(csvPath, "utf8");

    console.log("Submitting workflow to AAVA...");
    console.log("Base URL:", AAVA_API_BASE_URL);
    console.log("Pipeline ID:", AAVA_PIPELINE_ID);
    console.log("User:", AAVA_USER_EMAIL);

    const formData = new FormData();
    formData.append("pipelineId", AAVA_PIPELINE_ID);
    formData.append("user", AAVA_USER_EMAIL);
    formData.append("priority", "1");
    formData.append("userInputs", JSON.stringify({ "{{input_string_true}}": csvContent }));

    const submitRes = await fetch(`${AAVA_API_BASE_URL}/workflows/workflow-executions`, {
        method: "POST",
        headers: {
            "Accept": "application/json, text/plain, */*",
            "Authorization": `Bearer ${AAVA_BEARER_TOKEN}`,
            "X-Realm-Id": AAVA_REALM_ID
        },
        body: formData
    });

    console.log("Submit HTTP Status:", submitRes.status);
    const submitData = await submitRes.json();
    console.log("Submit Response:", JSON.stringify(submitData, null, 2));

    const executionId = submitData?.data?.workflowExecutionId;
    if (!executionId) {
        console.error("No execution ID returned!");
        return;
    }

    console.log(`Polling for result with executionId: ${executionId}...`);

    for (let i = 0; i < 20; i++) {
        await new Promise(r => setTimeout(r, 4000));
        console.log(`Poll attempt ${i + 1}...`);

        const pollRes = await fetch(`${AAVA_API_BASE_URL}/workflows/workflow-executions/${executionId}/result`, {
            method: "GET",
            headers: {
                "Accept": "application/json, text/plain, */*",
                "Authorization": `Bearer ${AAVA_BEARER_TOKEN}`
            }
        });

        console.log("Poll HTTP Status:", pollRes.status);
        const pollData = await pollRes.json();
        
        if (pollData?.data?.result?.output || pollData?.data?.result?.response) {
            console.log("RESULT RECEIVED!");
            console.log("Output preview:", (pollData.data.result.output || "").slice(0, 300));
            break;
        } else {
            console.log("Status:", pollData?.data?.status || pollData?.status);
        }
    }
}

testWorkflow().catch(console.error);
