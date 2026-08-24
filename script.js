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

function setChatOpen(isOpen) {
    if (!chatWindow) return;

    chatWindow.classList.toggle('hidden', !isOpen);
    document.body.classList.toggle('chat-open', isOpen);
}

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
        setChatOpen(isHidden);

        if (isHidden && !window.matchMedia('(max-width: 480px)').matches) {
            chatInput.focus();
        }
    });
}

if (closeChat && chatWindow) {
    closeChat.addEventListener('click', () => {
        setChatOpen(false);
    });
}

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') setChatOpen(false);
});

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
const GITHUB_USERNAME = 'ChickenGor';

function getRepoName(event) {
    const fullName = event.repo?.name || 'Repository';
    return fullName.includes('/') ? fullName.split('/')[1] : fullName;
}

async function getPushMessage(event) {
    const embeddedMessage = event.payload?.commits?.[0]?.message;
    if (embeddedMessage) return embeddedMessage;

    const headSha = event.payload?.head;
    const repo = event.repo?.name;
    if (!headSha || !repo) return null;

    const response = await fetch(`https://api.github.com/repos/${repo}/commits/${headSha}`);
    if (!response.ok) return null;

    const commit = await response.json();
    return commit.commit?.message || null;
}

async function describeGithubEvent(event) {
    const repoName = getRepoName(event);

    if (event.type === 'PushEvent') {
        const message = await getPushMessage(event);
        if (message) return message.replace(/\s+/g, ' ').trim();

        const count = event.payload?.distinct_size || 1;
        return `Pushed ${count} commit${count === 1 ? '' : 's'} to ${repoName}`;
    }

    if (event.type === 'CreateEvent') {
        return `Created ${event.payload?.ref_type || 'a repository'}${event.payload?.ref ? ` “${event.payload.ref}”` : ''}`;
    }

    if (event.type === 'ReleaseEvent') {
        return `Published ${event.payload?.release?.tag_name || 'a new release'}`;
    }

    if (event.type === 'PullRequestEvent') {
        return `${event.payload?.action || 'Updated'} pull request #${event.payload?.number || ''}`.trim();
    }

    if (event.type === 'IssuesEvent') {
        return `${event.payload?.action || 'Updated'} issue #${event.payload?.issue?.number || ''}`.trim();
    }

    return event.type.replace('Event', '');
}

function createActivityItem(event, message) {
    const date = new Date(event.created_at);
    const dateString = date.toLocaleDateString('en-US', {month: 'short', day: 'numeric'});
    const timeString = date.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
    const li = document.createElement('li');
    const repo = document.createElement('strong');
    const activity = document.createElement('span');
    const timestamp = document.createElement('span');

    li.className = 'commit-item';
    repo.className = 'commit-repo';
    activity.className = 'commit-message';
    timestamp.className = 'commit-date';
    repo.textContent = getRepoName(event);
    activity.textContent = message;
    timestamp.textContent = `${dateString} • ${timeString}`;

    li.append(repo, activity, timestamp);
    return li;
}

async function fetchGitHubActivity() {
    const commitsContainer = document.getElementById('github-commits');
    if (!commitsContainer) return;

    try {
        const response = await fetch(`https://api.github.com/users/${GITHUB_USERNAME}/events/public`, {
            headers: {'Accept': 'application/vnd.github.v3+json'},
        });
        if (!response.ok) throw new Error('Could not reach GitHub');

        const events = await response.json();
        if (!Array.isArray(events) || events.length === 0) {
            commitsContainer.textContent = 'No recent activity found.';
            return;
        }

        const recentEvents = events
            .filter((event) => ['PushEvent', 'CreateEvent', 'ReleaseEvent', 'PullRequestEvent', 'IssuesEvent'].includes(event.type))
            .slice(0, 3);

        if (recentEvents.length === 0) {
            commitsContainer.textContent = 'No recent activity found.';
            return;
        }

        const messages = await Promise.all(recentEvents.map(describeGithubEvent));
        commitsContainer.replaceChildren(...recentEvents.map((event, index) => createActivityItem(event, messages[index])));
    } catch (error) {
        console.error('Error fetching GitHub data:', error);
        commitsContainer.textContent = 'Unable to load activity.';
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
