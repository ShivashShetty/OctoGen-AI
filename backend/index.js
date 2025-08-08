// Import required packages
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cookieParser = require('cookie-parser');
const { Octokit } = require("@octokit/rest");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize the Express app
const app = express();

// Use middleware
app.use(cors({
  origin: 'http://localhost:5173', // Allow requests from your frontend
  credentials: true                 // Allow cookies to be sent
}));
app.use(cookieParser()); // Use cookie-parser to read cookies from requests
app.use(express.json()); // Add this to parse JSON request bodies

// Initialize the AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);


// --- AUTHENTICATION ROUTES ---
app.get('/api/auth/github', (req, res) => {
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&scope=repo`;
  res.redirect(githubAuthUrl);
});

app.get('/api/auth/github/callback', async (req, res) => {
  const { code } = req.query;
  try {
    const tokenResponse = await axios.post('https://github.com/login/oauth/access_token', {
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code: code
    }, {
      headers: { 'Accept': 'application/json' }
    });
    const accessToken = tokenResponse.data.access_token;
    res.cookie('accessToken', accessToken, { httpOnly: true });
    res.cookie('isLoggedIn', 'true');
    res.redirect('http://localhost:5173');
  } catch (error) {
    console.error('Error during GitHub OAuth', error);
    res.status(500).json({ message: 'Authentication failed' });
  }
});

app.get('/api/auth/logout', (req, res) => {
  res.clearCookie('accessToken');
  res.clearCookie('isLoggedIn');
  res.redirect('http://localhost:5173');
});


// --- GITHUB API ROUTES ---
app.get('/api/github/repos', async (req, res) => {
  const accessToken = req.cookies.accessToken;
  if (!accessToken) { return res.status(401).json({ message: 'Unauthorized' }); }
  try {
    const octokit = new Octokit({ auth: accessToken });
    const { data: repos } = await octokit.repos.listForAuthenticatedUser();
    res.json(repos.map(repo => ({
      id: repo.id,
      name: repo.name,
      full_name: repo.full_name,
      private: repo.private
    })));
  } catch (error) {
    console.error('Error fetching repositories', error);
    res.status(500).json({ message: 'Failed to fetch repositories' });
  }
});

app.get('/api/github/repo-contents/:owner/:repo', async (req, res) => {
  const accessToken = req.cookies.accessToken;
  if (!accessToken) { return res.status(401).json({ message: 'Unauthorized' }); }
  const { owner, repo } = req.params;
  const path = req.query.path || '';
  try {
    const octokit = new Octokit({ auth: accessToken });
    const { data: contents } = await octokit.repos.getContent({ owner, repo, path });
    res.json(contents);
  } catch (error) {
    console.error('Error fetching repo contents', error);
    res.status(500).json({ message: 'Failed to fetch repo contents' });
  }
});


// --- AI ENDPOINT ---
app.post('/api/ai/summarize', async (req, res) => {
    const accessToken = req.cookies.accessToken;
    if (!accessToken) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
  
    const { repoFullName, filePaths } = req.body;
    if (!repoFullName || !filePaths || filePaths.length === 0) {
      return res.status(400).json({ message: 'Repository and file paths are required.' });
    }
  
    const [owner, repo] = repoFullName.split('/');
  
    try {
      const octokit = new Octokit({ auth: accessToken });
      
      const fileContents = await Promise.all(
        filePaths.map(async (path) => {
          const { data } = await octokit.repos.getContent({ owner, repo, path });
          const content = Buffer.from(data.content, 'base64').toString('utf-8');
          return { path, content };
        })
      );
  
      // This is the full prompt string
      let prompt = `You are a senior software test engineer. Your task is to generate high-level unit test case summaries for the following code files.
      
For each file, provide a few distinct test case ideas that cover happy paths, edge cases, and error handling.

Format your entire response as a single, minified JSON array of objects. Each object in the array should represent a file and have two keys: "fileName" (the path of the file) and "summaries" (an array of strings, where each string is a test case summary). Do not include any other text or markdown formatting.

Here are the files:
`;
  
      fileContents.forEach(file => {
        prompt += `
---
File: ${file.path}
\`\`\`
${file.content}
\`\`\`
`;
      });
  
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      // This is the debug line to see what the AI is sending
      console.log("--- RAW AI RESPONSE --- \n", text, "\n--- END RAW AI RESPONSE ---");
  
      const startIndex = text.indexOf('[');
      const endIndex = text.lastIndexOf(']');
  
      if (startIndex !== -1 && endIndex !== -1) {
        const jsonString = text.substring(startIndex, endIndex + 1);
        res.json(JSON.parse(jsonString));
      } else {
        throw new Error("Could not find a valid JSON array in the AI response.");
      }
  
    } catch (error) {
      console.error('Error with AI summarization', error);
      res.status(500).json({ message: 'Failed to generate or parse AI summaries.' });
    }
  });

// In backend/index.js
// --- 5. ADD NEW ROUTE FOR CODE GENERATION ---

app.post('/api/ai/generate-code', async (req, res) => {
  const accessToken = req.cookies.accessToken;
  if (!accessToken) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { repoFullName, filePath, summary, language } = req.body;
  if (!repoFullName || !filePath || !summary) {
    return res.status(400).json({ message: 'Repo, file path, and summary are required.' });
  }

  const [owner, repo] = repoFullName.split('/');

  try {
    const octokit = new Octokit({ auth: accessToken });
    
    // Fetch the content of the relevant file
    const { data } = await octokit.repos.getContent({ owner, repo, path: filePath });
    const fileContent = Buffer.from(data.content, 'base64').toString('utf-8');

    // --- New, more specific prompt for code generation ---
    const prompt = `You are an expert code generator. Your task is to write a complete, runnable unit test based on the provided summary and source code.
    
The testing framework should be appropriate for the language. For Python, use 'pytest'. For JavaScript/React, use 'Jest' and 'React Testing Library'.

Only output the raw code for the test file. Do not include any explanation, markdown formatting, or any text other than the code itself.

**Language:** ${language}
**Test Summary:** "${summary}"

**Source Code from file '${filePath}':**
\`\`\`
${fileContent}
\`\`\`
`;
    
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(prompt);
    const response = result.response;
    const generatedCode = response.text();

    // Send the raw code back to the frontend
    res.json({ code: generatedCode });

  } catch (error) {
    console.error('Error with AI code generation', error);
    res.status(500).json({ message: 'Failed to generate AI code.' });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});