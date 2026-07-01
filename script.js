// --- 1. Theme Toggle Logic ---
const themeToggleBtn = document.getElementById('theme-toggle');
const icon = themeToggleBtn.querySelector('i');

themeToggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    
    // Switch between moon and sun icons
    if (document.body.classList.contains('dark-mode')) {
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
    } else {
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
    }
});

// --- 2. Scroll Animation Logic ---
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
        typingSpeed = 2000; // Pause at end of word
        isDeleting = true;
    } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        wordIndex = (wordIndex + 1) % words.length;
        typingSpeed = 500; // Pause before next word
    }

    setTimeout(typeEffect, typingSpeed);
}

// Start the effect
document.addEventListener("DOMContentLoaded", typeEffect);

// --- 4. Jimmy-Bot Chatbot Logic ---
const chatToggle = document.getElementById('chatbot-toggle');
const chatWindow = document.getElementById('chatbot-window');
const closeChat = document.getElementById('close-chat');
const sendBtn = document.getElementById('send-btn');
const chatInput = document.getElementById('chat-input');
const chatHistory = document.getElementById('chat-history');

// Open and Close Chat
chatToggle.addEventListener('click', () => {
    chatWindow.classList.remove('hidden');
});

closeChat.addEventListener('click', () => {
    chatWindow.classList.add('hidden');
});

// Function to add a message to the chat
function addMessage(text, sender) {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message');
    msgDiv.classList.add(sender === 'user' ? 'user-message' : 'ai-message');
    msgDiv.textContent = text;
    
    chatHistory.appendChild(msgDiv);
    
    // Auto-scroll to the bottom
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

// Handle sending a message
function handleSend() {
    const userText = chatInput.value.trim();
    if (!userText) return;

    // 1. Add user message to UI
    addMessage(userText, 'user');
    chatInput.value = '';

    // 2. Add a temporary "typing..." indicator
    const typingId = "typing-" + Date.now();
    const typingDiv = document.createElement('div');
    typingDiv.classList.add('message', 'ai-message');
    typingDiv.setAttribute('id', typingId);
    typingDiv.textContent = "...";
    chatHistory.appendChild(typingDiv);
    chatHistory.scrollTop = chatHistory.scrollHeight;

    // 3. Simulated API Call (Replace this with actual Gemini/OpenAI Fetch later)
    setTimeout(() => {
        document.getElementById(typingId).remove();
        
        // Mock responses based on keywords
        let aiResponse = "I'm still learning! But I can tell you Jimmy is a great Software Engineer.";
        if (userText.toLowerCase().includes("flutter")) {
            aiResponse = "Jimmy loves Flutter! He built EMERS and Akumi using Flutter and Dart.";
        } else if (userText.toLowerCase().includes("utar") || userText.toLowerCase().includes("education")) {
            aiResponse = "Jimmy is a Computer Science undergraduate at UTAR, graduating in Jan 2027.";
        } else if (userText.toLowerCase().includes("hire") || userText.toLowerCase().includes("intern")) {
            aiResponse = "He is actively seeking a final-semester software engineering internship! You should email him at jwong0853@gmail.com.";
        }

        addMessage(aiResponse, 'ai');
    }, 1000);
}

// Event Listeners for sending
sendBtn.addEventListener('click', handleSend);
chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleSend();
    }
});

// --- 5. Live GitHub Activity Fetcher ---
// Replace 'yourusername' with your actual GitHub username!
const GITHUB_USERNAME = 'ChickenGor'; 
const commitsContainer = document.getElementById('github-commits');

async function fetchGitHubActivity() {
    // Only run if the container exists on the page
    if (!commitsContainer) return;

    try {
        // Call the public GitHub REST API
        const response = await fetch(`https://api.github.com/users/${GITHUB_USERNAME}/events/public`);
        
        if (!response.ok) throw new Error('Network response was not ok');
        
        const data = await response.json();
        
        // Filter the events to only show "PushEvents" (times you actually pushed code)
        // and grab the 3 most recent ones
        const pushEvents = data.filter(event => event.type === 'PushEvent').slice(0, 3);
        
        if (pushEvents.length === 0) {
            commitsContainer.innerHTML = '<li>No recent code pushes found.</li>';
            return;
        }

        // Clear the "Loading..." text
        commitsContainer.innerHTML = ''; 

        // Loop through the 3 events and build the HTML
        pushEvents.forEach(event => {
            // Clean up the repo name (removes your username from the front)
            const repoName = event.repo.name.replace(`${GITHUB_USERNAME}/`, '');
            
            // Get the commit message (defaults to 'Update' if missing)
            const commitMsg = event.payload.commits[0]?.message || 'Updated repository';
            
            // Format the date nicely
            const commitDate = new Date(event.created_at).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
            });

            // Create the list item
            const listItem = document.createElement('li');
            listItem.classList.add('commit-item');
            listItem.innerHTML = `
                <div class="commit-top-row">
                    <span class="commit-repo"><i class="fas fa-code-branch"></i> ${repoName}</span>
                    <span class="commit-date">${commitDate}</span>
                </div>
                <span class="commit-message">${commitMsg}</span>
            `;
            commitsContainer.appendChild(listItem);
        });
    } catch (error) {
        console.error('Error fetching GitHub data:', error);
        commitsContainer.innerHTML = '<li>Unable to load recent activity at the moment.</li>';
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
    if (e.key === '`') {
        terminalOverlay.classList.remove('hidden');
        terminalInput.focus(); // Automatically put the cursor in the input box
        e.preventDefault(); // Stop the backtick from actually typing into the box
    }
});

// Close button logic
closeTerminalBtn.addEventListener('click', () => {
    terminalOverlay.classList.add('hidden');
});

// 2. Handle Terminal Commands
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

function printToTerminal(text, isHtml = false) {
    const p = document.createElement('p');
    if (isHtml) {
        p.innerHTML = text;
    } else {
        p.textContent = text;
    }
    terminalOutput.appendChild(p);
}

function processCommand(cmd) {
    switch(cmd) {
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