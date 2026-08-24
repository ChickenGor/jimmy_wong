// --- 1. Scroll Animation Logic ---
// Select all elements that have the 'animate-on-scroll' class
const animatedElements = document.querySelectorAll('.animate-on-scroll');

// Create an Intersection Observer
const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        // If the element is currently visible on the screen
        if (entry.isIntersecting) {
            // Add the 'is-visible' class to trigger the CSS animation
            entry.target.classList.add('is-visible');

            // Stop observing the element so it doesn't animate again if you scroll up
            observer.unobserve(entry.target);
        }
    });
}, {
    // Trigger the animation when 15% of the element is visible
    threshold: 0.15
});

// Tell the observer to watch every element we selected
animatedElements.forEach((element) => {
    observer.observe(element);
});

// --- 3. Typing Effect ---
const words = ["Flutter Apps.", "AI Workflows.", "Full-Stack Web.", "LLM Agents."];
let wordIndex = 0;
let charIndex = 0;
let isDeleting = false;
const typingSpan = document.querySelector('.typing-text');

function typeEffect() {
    if (!typingSpan) return;

    const currentWord = words[wordIndex];

    if (isDeleting) {
        typingSpan.textContent = currentWord.substring(0, charIndex - 1);
        charIndex--;
    } else {
        typingSpan.textContent = currentWord.substring(0, charIndex + 1);
        charIndex++;
    }

    let typingSpeed = isDeleting ? 50 : 100;

    if (!isDeleting && charIndex === currentWord.length) {
        typingSpeed = 2000;
        isDeleting = true;
    } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        wordIndex = (wordIndex + 1) % words.length;
        typingSpeed = 500;
    }

    setTimeout(typeEffect, typingSpeed);
}

document.addEventListener("DOMContentLoaded", typeEffect);

// --- 4. Jimmy-Bot Chatbot Logic ---
const chatToggle = document.getElementById('chatbot-toggle');
const chatWindow = document.getElementById('chatbot-window');
const closeChat = document.getElementById('close-chat');
const sendBtn = document.getElementById('send-btn');
const chatInput = document.getElementById('chat-input');
const chatHistory = document.getElementById('chat-history');
const API_URL = 'https://jimmy-wong.vercel.app/api/chat';

async function getAIResponse(userPrompt) {
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userPrompt }),
    });

    if (!response.ok) {
        throw new Error('AI service request failed');
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || 'I could not generate a response right now.';
}
// Open and Close Chat
if (chatToggle && chatWindow && chatInput) {
    chatToggle.addEventListener('click', () => {
        const isHidden = chatWindow.classList.contains('hidden');
        chatWindow.classList.toggle('hidden', !isHidden);

        if (!chatWindow.classList.contains('hidden')) {
            chatInput.focus();
        }
    });
}

if (closeChat && chatWindow) {
    closeChat.addEventListener('click', () => {
        chatWindow.classList.add('hidden');
    });
}

// Function to add a message to the chat UI
function addMessage(text, sender) {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message');
    msgDiv.classList.add(sender === 'user' ? 'user-message' : 'ai-message');
    msgDiv.textContent = text;

    chatHistory.appendChild(msgDiv);
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

// Handle sending a message
async function handleSend() {
    if (!chatInput || !chatHistory) return;

    const userText = chatInput.value.trim();
    if (!userText) return;

    addMessage(userText, 'user');
    chatInput.value = '';

    // 1. Show "Jimmy-Bot is typing..."
    const typingId = "typing-" + Date.now();
    const typingDiv = document.createElement('div');
    typingDiv.classList.add('message', 'ai-message');
    typingDiv.setAttribute('id', typingId);
    typingDiv.textContent = "Jimmy-Bot is typing..."; // More professional than "..."
    chatHistory.appendChild(typingDiv);
    chatHistory.scrollTop = chatHistory.scrollHeight;

    // 2. Add a small artificial delay so the typing indicator is visible
    // This makes it feel like the AI is actually "thinking"
    await new Promise(resolve => setTimeout(resolve, 1200));

    // 3. API Call
    try {
        const aiResponse = await getAIResponse(userText);

        document.getElementById(typingId).remove();
        addMessage(aiResponse, 'ai');
    } catch (error) {
        document.getElementById(typingId).remove();
        addMessage("Jimmy-Bot is currently taking a coffee break. Please email me at jwong0853@gmail.com!", 'ai');
    }
}

// Event Listeners for sending
if (sendBtn) {
    sendBtn.addEventListener('click', handleSend);
}

if (chatInput) {
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSend();
        }
    });
}

// --- 5. Live GitHub Activity Fetcher ---
// Replace 'yourusername' with your actual GitHub username!
const GITHUB_USERNAME = 'ChickenGor';
const commitsContainer = document.getElementById('github-commits');

async function fetchGitHubActivity() {
    // 1. Safety check: Look for the element
    const commitsContainer = document.getElementById('github-commits');

    // If the element doesn't exist on the page, exit immediately to avoid the crash
    if (!commitsContainer) {
        console.warn("GitHub commits container not found. Skipping activity fetch.");
        return;
    }

    try {
        const GITHUB_USERNAME = 'ChickenGor';
        const response = await fetch(`https://api.github.com/users/${GITHUB_USERNAME}/events/public`, {
            headers: { 'Accept': 'application/vnd.github.v3+json' }
        });

        if (!response.ok) throw new Error("Could not reach GitHub");

        const data = await response.json();

        // Check if data is valid
        if (!data || !Array.isArray(data) || data.length === 0) {
            commitsContainer.innerHTML = '<li>No recent activity found.</li>';
            return;
        }

        const pushEvents = data.filter(event => event.type === 'PushEvent');

        if (pushEvents.length === 0) {
            commitsContainer.innerHTML = '<li>No recent pushes.</li>';
            return;
        }

        // Display the top 3
        commitsContainer.innerHTML = '';
        pushEvents.slice(0, 3).forEach(event => {
            const rawRepoName = event.repo?.name || 'Repository';
            const repoName = rawRepoName.includes('/') ? rawRepoName.split('/')[1] : rawRepoName;

            const commitMessages = (event.payload?.commits || [])
                .map(commit => commit?.message)
                .filter(Boolean)
                .map(message => message.replace(/\s+/g, ' ').trim());

            let activityText = '';

            if (commitMessages.length > 0) {
                activityText = commitMessages[0];
            }

            if (!activityText) {
                const commitCount = event.payload?.distinct_size || 1;
                activityText = commitCount > 1
                    ? `Pushed ${commitCount} updates to ${repoName}`
                    : `Pushed a fresh update to ${repoName}`;
            }

            if (activityText.length > 36) {
                activityText = activityText.substring(0, 33) + '...';
            }

            const date = new Date(event.created_at);
            const dateString = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            const li = document.createElement('li');
            li.style.marginBottom = "15px";
            li.innerHTML = `
        <div style="border-left: 3px solid #0ea5e9; padding-left: 12px;">
            <strong style="display: block; color: #ffffff; font-size: 1.05rem;">${repoName}</strong>
            <span style="font-size: 0.9rem; color: #e2e8f0;">${activityText}</span>
            <br><span style="font-size: 0.75rem; opacity: 0.6; color: #cbd5e1;">${dateString} • ${timeString}</span>
        </div>
    `;
            commitsContainer.appendChild(li);
        });

    } catch (error) {
        console.error("Error fetching GitHub data:", error);
        // Only update innerHTML if commitsContainer was successfully found
        if (commitsContainer) {
            commitsContainer.innerHTML = '<li>Unable to load activity.</li>';
        }
    }
}

// Trigger the fetch exactly when the page loads
document.addEventListener('DOMContentLoaded', fetchGitHubActivity);

// --- 6. Terminal Easter Egg Logic ---
const terminalOverlay = document.getElementById('terminal-overlay');
const terminalInput = document.getElementById('terminal-input');
const terminalOutput = document.getElementById('terminal-output');
const closeTerminalBtn = document.getElementById('close-terminal');

// 1. Listen for the Backtick (`) key to open the terminal
document.addEventListener('keydown', (e) => {
    if (e.key === '`' && terminalOverlay && terminalInput) {
        terminalOverlay.classList.remove('hidden');
        terminalInput.focus(); // Automatically put the cursor in the input box
        e.preventDefault(); // Stop the backtick from actually typing into the box
    }
});

// Close button logic
if (closeTerminalBtn && terminalOverlay) {
    closeTerminalBtn.addEventListener('click', () => {
        terminalOverlay.classList.add('hidden');
    });
}

// 2. Handle Terminal Commands
if (terminalInput && terminalOutput) {
    terminalInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const command = terminalInput.value.trim().toLowerCase();

            // Print the user's command to the screen
            printToTerminal(`guest@jimmy-wong:~$ ${command}`, false);

            // Process the command
            processCommand(command);

            // Clear the input box
            terminalInput.value = '';

            // Scroll to the bottom
            terminalOutput.scrollTop = terminalOutput.scrollHeight;
        }
    });
}

function printToTerminal(text, isHtml = false) {
    if (!terminalOutput) return;

    const p = document.createElement('p');
    if (isHtml) {
        p.innerHTML = text;
    } else {
        p.textContent = text;
    }
    terminalOutput.appendChild(p);
}

function processCommand(cmd) {
    switch (cmd) {
        case 'help':
            printToTerminal(`Available commands: <br>
            <span class="highlight">whoami</span>   - Learn about me<br>
            <span class="highlight">skills</span>   - List my technical stack<br>
            <span class="highlight">contact</span>  - Get my email<br>
            <span class="highlight">clear</span>    - Clear the terminal screen<br>
            <span class="highlight">exit</span>     - Close the terminal`, true);
            break;
        case 'whoami':
            printToTerminal("I am Jimmy Wong Jia Cheng, a CS undergrad at UTAR graduating in Jan 2027. I specialize in building intelligent Flutter apps and integrating LLMs.");
            break;
        case 'skills':
            printToTerminal("Core: Python, Dart, JavaScript, Java, C++ <br>Frameworks: Flutter, ReactJS, Node.js, LangChain <br>Data/AI: AWS, Firebase, MySQL, Gemini API, OpenAI API", true);
            break;
        case 'contact':
            printToTerminal("Email me at: <span class='highlight'>jwong0853@gmail.com</span>", true);
            break;
            break;
        case 'clear':
            terminalOutput.innerHTML = '';
            break;
        case 'exit':
            terminalOverlay.classList.add('hidden');
            break;
        case '':
            break; // Do nothing if they just press enter
        default:
            printToTerminal(`Command not found: ${cmd}. Type 'help' for a list of commands.`);
    }
}

// --- 7. Aurora Scroll Progress Bar Logic ---
const progressBar = document.getElementById('scroll-progress');

window.addEventListener('scroll', () => {
    if (!progressBar) return;

    // How far down the user has scrolled
    const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;

    // The total height of the webpage minus the window height
    const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;

    // Calculate the percentage
    const scrollPercentage = (scrollTop / scrollHeight) * 100;

    // Update the width of the progress bar
    progressBar.style.width = scrollPercentage + '%';
});

// --- 9. Chatbot Quick Replies ---
function sendQuickReply(message) {
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');

    if (!chatInput || !sendBtn) return;

    // Set the input value to the chip text
    chatInput.value = message;

    // Trigger the send button click
    sendBtn.click();
}
