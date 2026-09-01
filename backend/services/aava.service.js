const fs = require("fs");
const path = require("path");
const { getStoreAIContext } = require("./ai-context.service");
const { getInventory } = require("./data.service");

const AAVA_API_BASE_URL = process.env.AAVA_API_BASE_URL || "https://int-ai.aava.ai";
const AAVA_PIPELINE_ID = process.env.AAVA_PIPELINE_ID || "21773";
const AAVA_USER_EMAIL = process.env.AAVA_USER_EMAIL || "bhaibhav.raj@ascendion.com";
const AAVA_REALM_ID = process.env.AAVA_REALM_ID || "32";
const AAVA_BEARER_TOKEN = process.env.AAVA_BEARER_TOKEN || "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJCaGFpYmhhdiBSYWoiLCJpYXQiOjE3ODgyNjcyNDUsImV4cCI6MTc5NjE2OTU5OSwiYXBwaWQiOiJlYTVmYTE0NC0yMmE5LTQzYzYtOWJiZi0wN2Q4NjdhOGU5NmUiLCJ1bmlxdWVfbmFtZSI6ImJoYWliaGF2LnJhakBhc2NlbmRpb24uY29tIiwiZG9tYWluIjoiaW50LWFpLmFhdmEuYWkiLCJ1c2VyRGV0YWlscyI6Im5GbkxBNFFyUjk3RGNSVGZ6NE40OFdIRDFYRndXVDVyZUpPQnAwYjJTaThTNjVJUkJnWW82TXpIRzlHTUYwYlplT1hGaU9ZNytZdHlYWCtsQkxYbHlUQllxTjQ2bTd1K1Z3c21IWDJCMVhGS1JMSnNibE1pWmRMaTVEektRa0x5OGRXRkhKZFl5Y1NpVzJCa3dMQVN6RjVwSk9QdGlKV0tQcENFdmVLUXRNbz0ifQ.Y4T5RpGr2KWu2SzFAXdpw0aGpcGcvVJft6sQRgpVuYJ9wxXDUSyHW3xR_GIxlGaw7KbgJqlO-EbOIgAem2G0g3VbrMf5uuagOGS01rFP_Re1gQRXsgFojLVYO_seK0eCJCiwtXm8Sy2BXzRZGgBAFTr_BBOAA30HCRhwgMGydy3un-siQ7-1fXm11g6qaiGfYF2taH908yjuOcBPe-p6PbsQumy85k-DkRgF-fyO0zjL1KZm57biOH1jReyAjZy4Ob5otLx6PCUVeaDRCpRQUTYap73_x0ZXnCkAAH2IkvsEBq3XzPUORqyWvO1L6kA6H3Nbwe0Uo5uDuskb1ec0Xg";

/**
 * Get CSV formatted string for inventory (all stores or specific store)
 */
function getInventoryCsvString(storeId = null) {
    const csvPath = path.join(__dirname, "..", "data", "inventory.csv");
    if (fs.existsSync(csvPath)) {
        if (!storeId) {
            return fs.readFileSync(csvPath, "utf8");
        }
        // If specific store requested, return header + rows for that store
        const inventory = getInventory();
        const storeRows = inventory.filter(i => i.store_id === storeId);
        if (storeRows.length > 0) {
            const keys = Object.keys(storeRows[0]);
            let csv = keys.join(",") + "\n";
            storeRows.forEach(row => {
                csv += keys.map(k => row[k]).join(",") + "\n";
            });
            return csv;
        }
        return fs.readFileSync(csvPath, "utf8");
    }
    return "";
}

/**
 * Executes the Live AAVA Workflow Engine via API
 */
async function executeAavaWorkflow({ csvContent, storeId = null }) {
    const payloadCsv = csvContent || getInventoryCsvString(storeId);

    if (!payloadCsv || !payloadCsv.trim()) {
        throw new Error("No CSV payload available for AAVA analysis");
    }

    try {
        console.log(`[AAVA Service] Initiating workflow execution (Pipeline: ${AAVA_PIPELINE_ID}, User: ${AAVA_USER_EMAIL})...`);

        const formData = new FormData();
        formData.append("pipelineId", AAVA_PIPELINE_ID);
        formData.append("user", AAVA_USER_EMAIL);
        formData.append("priority", "1");
        formData.append("userInputs", JSON.stringify({ "{{input_string_true}}": payloadCsv }));

        const submitRes = await fetch(`${AAVA_API_BASE_URL}/workflows/workflow-executions`, {
            method: "POST",
            headers: {
                "Accept": "application/json, text/plain, */*",
                "Authorization": `Bearer ${AAVA_BEARER_TOKEN}`,
                "X-Realm-Id": AAVA_REALM_ID
            },
            body: formData
        });

        if (!submitRes.ok) {
            const errText = await submitRes.text();
            console.error(`[AAVA Service] Submit HTTP ${submitRes.status}:`, errText);
            throw new Error(`AAVA Workflow submission failed with status ${submitRes.status}`);
        }

        const submitData = await submitRes.json();
        const workflowExecutionId = submitData?.data?.workflowExecutionId;

        if (!workflowExecutionId) {
            console.error("[AAVA Service] Missing workflowExecutionId in response:", submitData);
            throw new Error("AAVA API did not return a workflowExecutionId");
        }

        console.log(`[AAVA Service] Workflow submitted successfully. Execution ID: ${workflowExecutionId}. Polling for result...`);

        // Poll for completion (up to 30 attempts, 3s interval = ~90 seconds max)
        let markdownOutput = null;
        for (let attempt = 1; attempt <= 30; attempt++) {
            await new Promise(r => setTimeout(r, 3000));
            console.log(`[AAVA Service] Polling attempt ${attempt}/30 for ${workflowExecutionId}...`);

            const pollRes = await fetch(`${AAVA_API_BASE_URL}/workflows/workflow-executions/${workflowExecutionId}/result`, {
                method: "GET",
                headers: {
                    "Accept": "application/json, text/plain, */*",
                    "Authorization": `Bearer ${AAVA_BEARER_TOKEN}`
                }
            });

            if (!pollRes.ok) {
                console.warn(`[AAVA Service] Poll attempt ${attempt} returned HTTP ${pollRes.status}`);
                continue;
            }

            const pollData = await pollRes.json();
            const resultObj = pollData?.data?.result;

            if (resultObj) {
                // Extract markdown from possible output locations
                if (resultObj.output && resultObj.output.trim().length > 0) {
                    markdownOutput = resultObj.output;
                } else if (resultObj.response) {
                    try {
                        const parsedResp = typeof resultObj.response === 'string' 
                            ? JSON.parse(resultObj.response) 
                            : resultObj.response;
                        markdownOutput = parsedResp.output || parsedResp.tasksOutputs?.[0]?.output || parsedResp.tasksOutputs?.[0]?.raw;
                    } catch (e) {
                        markdownOutput = resultObj.response;
                    }
                }

                if (markdownOutput && markdownOutput.trim().length > 0) {
                    console.log(`[AAVA Service] Workflow execution completed successfully on attempt ${attempt}!`);
                    break;
                }
            }
        }

        if (markdownOutput) {
            return {
                is_mock: false,
                model: "AAVA Total Loss Analyst (Live Agent)",
                workflowExecutionId,
                generated_at: new Date().toISOString(),
                markdown: markdownOutput
            };
        }

        console.warn("[AAVA Service] Polling timed out waiting for result. Falling back to local synthesis.");
    } catch (error) {
        console.error("[AAVA Service] Live workflow execution error:", error.message);
    }

    // Fallback if live AAVA execution times out or encounters network error
    return generateFallbackBrief(storeId);
}

/**
 * Enterprise Development Fallback Report Generator
 */
function generateFallbackBrief(storeId = "S012") {
    const aiContext = getStoreAIContext(storeId || "S012") || {
        store: { store_id: storeId || "S012", store_name: "Bangalore Tech Park", region: "South" },
        financial_impact: { total_loss: 800000, return_loss: 528320, refund_loss: 75440, shrinkage_loss: 297250 },
        transaction_metrics: { return_rate: 66.04, refund_rate: 9.43, total_transactions: 106 },
        inventory_metrics: { discrepancy_quantity: 121, discrepancy_value: 297250 },
        top_returned_products: [{ product_name: "Ultra HD 4K Smart TV", return_count: 12, return_value: 288000 }],
        employee_patterns: [{ employee_id: "EMP007", returns: 14, refunds: 8 }]
    };

    const markdown = `# RETAIL LOSS PREVENTION INVESTIGATION BRIEF

**Investigation Date:** ${new Date().toISOString().split('T')[0]}  
**Target Store:** ${aiContext.store.store_name} (${aiContext.store.store_id})  
**Evidence Type:** Physical inventory count reconciliation data & POS audit

---

## EXECUTIVE SUMMARY

Analysis of store performance indicates that **${aiContext.store.store_name} (${aiContext.store.store_id})** represents a critical risk outlier. Total identified potential loss is **₹${aiContext.financial_impact.total_loss.toLocaleString('en-IN')}**, with return activity accounting for **${aiContext.transaction_metrics.return_rate}%** and inventory discrepancy reaching **${aiContext.inventory_metrics.discrepancy_quantity} units**.

---

## FACTS FROM EVIDENCE

| Metric Category | Observed Store Value | Network Baseline | Status |
|---|---|---|---|
| **Return Rate** | ${aiContext.transaction_metrics.return_rate}% | 17.13% | ⚠️ Elevated (+${(aiContext.transaction_metrics.return_rate - 17.13).toFixed(1)}%) |
| **Refund Rate** | ${aiContext.transaction_metrics.refund_rate}% | 13.93% | Normal Tolerance |
| **Inventory Shrinkage** | ₹${aiContext.inventory_metrics.discrepancy_value.toLocaleString('en-IN')} (${aiContext.inventory_metrics.discrepancy_quantity} units) | ₹42,788 | 🔴 Critical Discrepancy |
| **Potential Loss** | ₹${aiContext.financial_impact.total_loss.toLocaleString('en-IN')} | ₹1,36,636 | 🔴 Critical Outlier (5.8x baseline) |

---

## INTERPRETATION & RISK DRIVERS

### 1. High Discrepancy in Physical Inventory
Physical stock reconciliations detected **${aiContext.inventory_metrics.discrepancy_quantity} missing units** valued at ₹${aiContext.inventory_metrics.discrepancy_value.toLocaleString('en-IN')}. This variance represents a localized operational breakdown in stock receiving or cycle counting.

### 2. High-Value Return Concentration
Return transactions are heavily concentrated in premium electronics and high-ticket items. Terminal logs show repeated return processing without corresponding supervisor overrides.

---

## RECOMMENDED ACTIONS

1. **Immediate Cycle Recount (Within 24h):** Dispatch an independent loss prevention team to conduct a 100% manual recount of high-value SKUs at ${aiContext.store.store_id}.
2. **Audit Return Authorizations (Within 48h):** Review customer receipts and manager override sign-offs for all transactions exceeding ₹5,000.
3. **Register Terminal Surveillance Review (Within 72h):** Cross-reference POS time-stamped return logs against security camera footage covering cashier lanes.
4. **Tighten Inventory Inbound Verification:** Enforce dual-signoff receiving protocols at the store loading dock to eliminate supplier short-shipment discrepancies.

---

## DATA LIMITATIONS

*Analysis is based on August 2026 store audit logs and POS records. Employee identifications represent terminal activity logs and require administrative verification prior to conclusive disciplinary action.*`;

    return {
        is_mock: true,
        model: "AAVA Total Loss Analyst (Development Fallback)",
        workflowExecutionId: "mock-execution-" + Date.now(),
        generated_at: new Date().toISOString(),
        markdown
    };
}

/**
 * Standard AI analysis entry point
 */
async function generateAIAnalysis(storeId = "S012") {
    return executeAavaWorkflow({ storeId });
}

module.exports = {
    executeAavaWorkflow,
    generateAIAnalysis,
    getInventoryCsvString
};
