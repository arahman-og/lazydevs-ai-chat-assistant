require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { ChatOpenAI } = require("@langchain/openai");
const OpenAI = require("openai");
const { SystemMessage, HumanMessage } = require("@langchain/core/messages");
const { getPrompt } = require("./prompt");

const app = express();
const PORT = process.env.PORT || 5001;

app.use(express.json());
app.use(cors());

// const chat = new ChatOpenAI({
//     openAIApiKey: process.env.OPENAI_API_KEY,
//     modelName: "gpt-3.5-turbo",
// });

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
})

const conversationHistory = {};

app.post("/api/ask", async (req, res) => {
    try {
        const { prompt, data, metadata, sessionId } = req.body;
        if (!prompt || !sessionId) {
            return res.status(400).json({ error: "Missing required fields: prompt or sessionId" });
        }

        if (!conversationHistory[sessionId]) {
            conversationHistory[sessionId] = [
                { role: "system", content: getPrompt(data, metadata) },
            ]
        }

        conversationHistory[sessionId].push({ role: "user", content: prompt });

        const response = await client.chat.completions.create({
            messages: conversationHistory[sessionId],
            model: 'gpt-4o',
            temperature: 0
        });

        const assistantMessage = { role: "assistant", content: response.choices[0].message.content };
        conversationHistory[sessionId].push(assistantMessage);

        res.json({ response: assistantMessage.content });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
