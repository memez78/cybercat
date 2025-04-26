// Element refs - Updated to include new UI elements
const welcomeScreen = document.getElementById('welcomeScreen');
const nameScreen = document.getElementById('nameScreen');
const ageScreen = document.getElementById('ageScreen');
const chatScreen = document.getElementById('chatScreen');
const parentDashboard = document.getElementById('parentDashboard');
const userDashboard = document.getElementById('userDashboard');
const nameInput = document.getElementById('name');
const ageInput = document.getElementById('age');
const startBtn = document.getElementById('startBtn');
const continueBtn = document.getElementById('continueBtn');
const normalUserBtn = document.getElementById('normalUserBtn');
const parentBtn = document.getElementById('parentBtn');
const ageSubmitBtn = document.getElementById('ageSubmitBtn');
const chatButton = document.getElementById('chatButton');
const parentChatBtn = document.getElementById('parentChatBtn');
const chatDiv = document.getElementById('chatMessages');
const installPrompt = document.getElementById('installPrompt');
const installBanner = document.getElementById('installBanner');
const notificationPrompt = document.getElementById('notificationPrompt');
const progressBar = document.getElementById('securityProgress');
const dashboardProgress = document.getElementById('dashboardProgress');
const scoreDisplay = document.getElementById('scoreDisplay');
const dashboardScore = document.getElementById('dashboardScore');
const parentScoreDisplay = document.getElementById('parentScoreDisplay');
const parentProgressBar = document.getElementById('parentProgressBar');
const missionProgressBar = document.getElementById('missionProgressBar');
const missionsCompleted = document.getElementById('missionsCompleted');
const timeSpent = document.getElementById('timeSpent');

// Mission-related elements
const missionCards = document.querySelectorAll('.mission-card');

// Global state
let userName = '', userAge = 0, securityScore = 0;
let userAgeGroup = 'adult'; // Default age group
let userMode = 'normal'; // 'normal' or 'parent'
let selectedAge = null;
let deferredPrompt;
let model; // TensorFlow.js QnA model
let isNotificationPromptShown = false;
let isInstallPromptShown = false;
let startTime = null;
let completedMissions = 0;
let activeMission = null;

// Enhanced installation prompt
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  
  // Show prompt after short delay
  setTimeout(() => {
    if (!isInstallPromptShown) {
      installPrompt.classList.remove('hidden');
      isInstallPromptShown = true;
    }
  }, 3000);
});

// Enhanced notification request
function requestNotificationPermission() {
  if ('Notification' in window) {
    // Show our custom UI first
    notificationPrompt.classList.remove('hidden');
    
    // Handle our custom buttons
    document.getElementById('notificationAccept').addEventListener('click', () => {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          // Schedule a welcome notification
          setTimeout(() => {
            new Notification('Welcome to Cyber Cat!', {
              body: 'You\'ll receive helpful security tips and progress updates!',
              icon: 'cyber_cat.png'
            });
          }, 1000);
          
          // Schedule periodic tips
          setInterval(() => {
            if (Notification.permission === 'granted') {
              const tips = [
                'Remember to use strong, unique passwords!',
                'Have you checked your privacy settings recently?',
                'Keep your apps and devices updated for security!'
              ];
              new Notification('Cyber Cat Tip', {
                body: tips[Math.floor(Math.random() * tips.length)],
                icon: 'cyber_cat.png'
              });
            }
          }, 3600000); // Every hour
        }
      });
      notificationPrompt.classList.add('hidden');
    });
    
    document.getElementById('notificationDismiss').addEventListener('click', () => {
      notificationPrompt.classList.add('hidden');
    });
  }
}






// Security missions data structure
const missions = {
  passwords: {
    title: "Password Protector",
    tasks: [
      { id: "pwd_1", question: "Do you use unique passwords for important accounts?", completed: false },
      { id: "pwd_2", question: "Is your password at least 12 characters long with a mix of letters, numbers, and symbols?", completed: false },
      { id: "pwd_3", question: "Have you set up two-factor authentication for your main accounts?", completed: false }
    ],
    tips: {
      child: [
        "Use a different password for each of your important games and apps",
        "Try using a silly sentence only you would know as your password",
        "Never share your passwords with friends, not even your best friends!"
      ],
      teen: [
        "Consider using a password manager to generate and store strong passwords",
        "Use passphrases instead of single words - they're easier to remember and harder to crack",
        "Enable two-factor authentication on social media accounts"
      ],
      adult: [
        "Use a password manager like Bitwarden (free) or LastPass",
        "Set up 2FA for email, banking, and social media accounts",
        "Periodically check for data breaches at haveibeenpwned.com"
      ],
      senior: [
        "Consider using a notebook kept in a secure location to write down passwords",
        "Use passphrases like 'purple elephant dancing quickly' that are easy to remember",
        "Never share passwords over the phone with anyone, even if they claim to be tech support"
      ]
    },
    progress: 0
  },
  privacy: {
    title: "Privacy Guardian",
    tasks: [
      { id: "prv_1", question: "Have you reviewed privacy settings on your social media accounts in the last month?", completed: false },
      { id: "prv_2", question: "Do you know which apps have access to your location, contacts, and camera?", completed: false },
      { id: "prv_3", question: "Do you avoid sharing personal information like your full address and phone number online?", completed: false }
    ],
    tips: {
      child: [
        "Ask a parent before sharing photos or information online",
        "Keep your real name, school and address private online",
        "Remember that things you share online can be seen by many people"
      ],
      teen: [
        "Check your social media privacy settings regularly",
        "Think before posting - could this content affect you in the future?",
        "Be cautious about which apps can access your location"
      ],
      adult: [
        "Regularly audit app permissions on your devices",
        "Use private browsing and consider a VPN for sensitive activities",
        "Limit the personal data you share on social media profiles"
      ],
      senior: [
        "Be cautious about joining groups or accepting friend requests from strangers",
        "Verify who you're talking to before sharing any personal information",
        "Consider using an email address specifically for online shopping"
      ]
    },
    progress: 0
  },
  phishing: {
    title: "Phishing Detective",
    tasks: [
      { id: "phi_1", question: "Do you check email sender addresses before clicking links?", completed: false },
      { id: "phi_2", question: "Can you identify at least 3 warning signs of a phishing attempt?", completed: false },
      { id: "phi_3", question: "Do you avoid clicking on pop-ups or unexpected download prompts?", completed: false }
    ],
    tips: {
      child: [
        "If a message or pop-up seems too exciting or scary, it might be a trick",
        "Always ask a grown-up before clicking on links or pop-ups",
        "Be careful of messages that ask for your password or personal information"
      ],
      teen: [
        "Check the sender's email address carefully for misspellings",
        "Be suspicious of messages that create urgency or fear",
        "Hover over links to see where they really go before clicking"
      ],
      adult: [
        "Verify suspicious emails by contacting the company directly",
        "Don't click links in emails claiming account problems",
        "Check URLs carefully - phishing sites often use similar domains"
      ],
      senior: [
        "If someone calls claiming to be tech support, hang up and call the company directly",
        "Never provide personal information in response to an email",
        "Be wary of messages about account problems or security alerts"
      ]
    },
    progress: 0
  },
  updates: {
    title: "Update Master",
    tasks: [
      { id: "upd_1", question: "Do you have automatic updates enabled on your devices?", completed: false },
      { id: "upd_2", question: "Have you updated your apps and operating system in the last month?", completed: false },
      { id: "upd_3", question: "Do you know why updates are important for security?", completed: false }
    ],
    tips: {
      child: [
        "Updates are like power-ups for your devices - they make them stronger",
        "Ask a parent to help you update your games and apps regularly",
        "When your device asks to update, don't ignore it!"
      ],
      teen: [
        "Set your devices to update automatically overnight",
        "Update your apps regularly - they often contain security fixes",
        "Don't postpone updates for too long, especially security updates"
      ],
      adult: [
        "Enable automatic updates for all devices including routers",
        "Regularly update all software, not just your operating system",
        "Consider replacing devices that no longer receive security updates"
      ],
      senior: [
        "Ask for help setting up automatic updates if needed",
        "When you see update notifications, don't dismiss them",
        "Keep a list of which devices need regular updates"
      ]
    },
    progress: 0
  },
  online_safety: {
    title: "Safe Explorer",
    tasks: [
      { id: "saf_1", question: "Do you check website security before entering personal information?", completed: false },
      { id: "saf_2", question: "Do you know how to distinguish between secure and insecure websites?", completed: false },
      { id: "saf_3", question: "Have you ever reported harmful or inappropriate content online?", completed: false }
    ],
    tips: {
      child: [
        "Look for the lock icon in the browser address bar before entering information",
        "Only visit websites that your parents or teachers have approved",
        "If you see something that makes you uncomfortable, tell a trusted adult"
      ],
      teen: [
        "Check for HTTPS and a lock icon before shopping or logging in",
        "Be careful about what you download and which sites you visit",
        "Know how to block and report unwanted contact or harmful content"
      ],
      adult: [
        "Use secure payment methods when shopping online",
        "Consider using a content blocker or security-focused browser extension",
        "Verify website security before entering financial information"
      ],
      senior: [
        "Always look for the lock icon and https:// in the address bar",
        "Be cautious about offers that seem too good to be true",
        "Only download software from official app stores or trusted sources"
      ]
    },
    progress: 0
  }
};

// Fallback responses organized by age group
const fallbackResponses = {
  child: {
    passwords: [
      "Passwords are like secret codes for your games! A good password should be hard for others to guess but easy for you to remember.",
      "Did you know that using your name or birthday as a password is like hiding your toys under your bed? Everyone knows to look there!",
      "Think of a password like a super secret handshake - it should be something only you know!"
    ],
    online_safety: [
      "When you see pop-up messages or flashing ads in games, they can be tricky! Always ask a grown-up before clicking.",
      "Some people online pretend to be someone they're not, just like in a game of pretend. Never share your real name or where you live.",
      "The internet is like a big playground where you can learn and have fun, but just like at a real playground, stay where it's safe!"
    ],
    updates: [
      "When your tablet or computer asks to update, it's like giving it new superpowers to fight bad guys!",
      "Updates are like giving your device a shield against bad guys. They help keep your games and apps safe.",
      "Think of updates like giving your device a power-up, just like in video games!"
    ]
  },
  teen: {
    passwords: [
      "Your password should be like your favorite inside joke - meaningful to you but confusing to everyone else!",
      "Using the same password everywhere is like using the same key for your house, car, and school locker. Not a great idea!",
      "A strong password is at least 12 characters with letters, numbers, and symbols. Maybe use lyrics from your favorite song?"
    ],
    social_media: [
      "Before posting that selfie, think: would you be OK if everyone at school saw it? Because they might!",
      "Those 'Which character are you?' quizzes might be fun, but they're also collecting data about you. Be careful what you share.",
      "Remember that what you post online stays online, even if you delete it. Think twice before sharing personal info!"
    ],
    privacy: [
      "Your location data is valuable - check which apps can access your location and turn it off when not needed.",
      "Those long terms & conditions? They're actually important! They tell you what data apps collect about you.",
      "Using public Wi-Fi for sensitive stuff like banking? That's like having a private conversation in a crowded cafeteria."
    ]
  },
  adult: {
    passwords: [
      "Consider using a password manager to generate and store strong, unique passwords for all your accounts.",
      "A truly strong password should contain at least 12 characters including uppercase, lowercase, numbers, and symbols.",
      "Adding two-factor authentication is like adding a deadbolt to your digital front door - it significantly improves security."
    ],
    phishing: [
      "Phishing emails have gotten sophisticated. Always verify the sender's actual email address and never click suspicious links.",
      "Legitimate organizations will never ask for your password or personal information via email.",
      "When in doubt about an email, contact the company directly using their official website or phone number - not the contact info in the email."
    ],
    updates: [
      "Software updates often contain critical security patches. Setting automatic updates can help ensure you're protected.",
      "Remember to update not just your computer and phone, but also your router, smart home devices, and any IoT devices.",
      "An outdated system is like leaving your window open - it gives attackers an easy way in."
    ]
  },
  senior: {
    passwords: [
      "Writing down passwords isn't ideal, but if you must, keep them in a secure location away from your computer.",
      "Consider using a passphrase - a sequence of random words - which is both secure and easier to remember than complex passwords.",
      "Never share your passwords with anyone, even if they claim to be from technical support or your bank."
    ],
    scams: [
      "Be wary of calls or emails claiming to be tech support or government agencies. Legitimate organizations don't call you unexpectedly.",
      "If someone creates a sense of urgency or fear ('Act now or else!'), it's likely a scam.",
      "When in doubt, hang up and call the company directly using the number from their official website or a recent bill."
    ],
    privacy: [
      "Check your privacy settings on social media platforms regularly, as they can change after updates.",
      "Be cautious about what you share online, particularly personal information that could be used to answer security questions.",
      "Consider using a separate email address for online shopping and subscriptions to reduce spam in your primary inbox."
    ]
  }
};

// Update the DOMContentLoaded event listener
window.addEventListener('DOMContentLoaded', () => {
  loadModel(); 
  nameScreen.classList.add('hidden');
  ageScreen.classList.add('hidden');
  chatScreen.classList.add('hidden');
  parentDashboard.classList.add('hidden');
  userDashboard.classList.add('hidden');
  
  // Start tracking session time
  startTime = new Date();
  
  // Immediately show install prompt if available
  setTimeout(() => {
    if (deferredPrompt && !isInstallPromptShown) {
      installPrompt.classList.remove('hidden');
      isInstallPromptShown = true;
    }
  }, 3000);
  
  // Show notification prompt after animations
  setTimeout(() => {
    if (!isNotificationPromptShown && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      notificationPrompt.classList.remove('hidden');
      isNotificationPromptShown = true;
    }
  }, 5000);
  
  // Initialize event listeners
  initializeEventListeners();
});

// Initialize all event listeners
function initializeEventListeners() {
  // Welcome screen buttons
  normalUserBtn.addEventListener('click', () => {
    userMode = 'normal';
    transitionToScreen(welcomeScreen, nameScreen);
  });
  
  parentBtn.addEventListener('click', () => {
    userMode = 'parent';
    transitionToScreen(welcomeScreen, nameScreen);
  });
  
  // Name input keypress
  nameInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter' && nameInput.value.trim() !== '') {
      handleNameSubmit();
    }
  });
  
  // Age buttons
  document.querySelectorAll('.age-button').forEach(button => {
    button.addEventListener('click', () => {
      document.querySelectorAll('.age-button').forEach(btn => btn.classList.remove('selected'));
      button.classList.add('selected');
      selectedAge = button.getAttribute('data-age');
      ageSubmitBtn.classList.remove('disabled');
    });
  });
  
  // Age submit button
  ageSubmitBtn.addEventListener('click', () => {
    if (selectedAge) {
      userAgeGroup = selectedAge;
      handleAgeSubmit();
    }
  });
  
  // Chat buttons
  chatButton.addEventListener('click', () => {
    transitionToScreen(userDashboard, chatScreen);
  });
  
  parentChatBtn.addEventListener('click', () => {
    transitionToScreen(parentDashboard, chatScreen);
    initializeChatForParent();
  });
  
  // Mission cards
  missionCards.forEach(card => {
    const missionId = card.getAttribute('data-mission');
    const actionBtn = card.querySelector('.mission-action');
    
    actionBtn.addEventListener('click', () => {
      startMission(missionId);
    });
  });
  
  // Install banner
  document.getElementById('installBannerBtn').addEventListener('click', () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(choiceResult => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
        } else {
          console.log('User dismissed the install prompt');
        }
        deferredPrompt = null;
      });
      installBanner.classList.add('hidden');
    }
  });
  
  document.getElementById('closeBanner').addEventListener('click', () => {
    installBanner.classList.add('hidden');
  });
  
  // Notification prompt
  document.getElementById('notificationAccept').addEventListener('click', () => {
    requestNotificationPermission();
    notificationPrompt.classList.add('hidden');
  });
  
  document.getElementById('notificationDismiss').addEventListener('click', () => {
    notificationPrompt.classList.add('hidden');
  });
  
  // Install prompt
  document.getElementById('installButton').addEventListener('click', () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(choiceResult => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
        } else {
          console.log('User dismissed the install prompt');
        }
        deferredPrompt = null;
      });
      installPrompt.classList.add('hidden');
    }
  });
  
  document.getElementById('closeInstall').addEventListener('click', () => {
    installPrompt.classList.add('hidden');
  });
}

// Handle name submission
function handleNameSubmit() {
  userName = nameInput.value.trim();
  
  if (!userName) {
    showError('nameError', 'Please enter your name');
    return;
  }
  
  // Sanitize user input to prevent XSS
  const sanitizedName = document.createElement('div');
  sanitizedName.textContent = userName;
  userName = sanitizedName.innerHTML;
  
  // Transition to age screen
  transitionToScreen(nameScreen, ageScreen);
}

// Handle age submission
function handleAgeSubmit() {
  if (userMode === 'parent') {
    // Show parent dashboard
    transitionToScreen(ageScreen, parentDashboard);
    initializeParentDashboard();
  } else {
    // Show user dashboard
    transitionToScreen(ageScreen, userDashboard);
    initializeUserDashboard();
  }
  
  // Show notification prompt after a delay
  setTimeout(() => {
    if (!isNotificationPromptShown && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      notificationPrompt.classList.remove('hidden');
      isNotificationPromptShown = true;
    }
  }, 5000);
  
  // Show install banner for PWA after a delay
  setTimeout(() => {
    if (!isInstallPromptShown && deferredPrompt) {
      installBanner.classList.remove('hidden');
      isInstallPromptShown = true;
    }
  }, 10000);
}

// Initialize parent dashboard
function initializeParentDashboard() {

const score = calculateChildScore();
const completed = countCompletedMissions();
const time = calculateTimeSpent();
  
  parentScoreDisplay.textContent = `${score}/100`;
  parentProgressBar.style.width = `${score}%`;
  missionsCompleted.textContent = `${completed}/5`;
  missionProgressBar.style.width = `${(completed / 5) * 100}%`;
  timeSpent.textContent = `${time} min`;
  
  // Add animation
  parentProgressBar.classList.add('progress-animate');
  missionProgressBar.classList.add('progress-animate');
  
  setTimeout(() => {
    parentProgressBar.classList.remove('progress-animate');
    missionProgressBar.classList.remove('progress-animate');
  }, 1000);
}

// Initialize user dashboard
function initializeUserDashboard() {
  // Set user name and avatar based on age group
  let avatarSrc = '';
  
  if (userAgeGroup === 'child') {
    avatarSrc = 'cyber_cat_kid.png';
  } else if (userAgeGroup === 'teen') {
    avatarSrc = 'cyber_cat_teen.png';
  } else if (userAgeGroup === 'adult') {
    avatarSrc = 'cyber_cat.png';
  } else {
    avatarSrc = 'cyber_cat_senior.png';
  }
  
  document.getElementById('dashboardAvatar').src = avatarSrc;
  
  // Initialize security score
  updateScore(5);
}

// Initialize chat for parent
function initializeChatForParent() {
  // Set chat avatar
  document.getElementById('chatAvatar').src = 'cyber_cat.png';
  
  // Clear previous messages
  chatDiv.innerHTML = '';
  
  // Add initial message
  addBotMessage("Hello! I'm Cyber Cat, your security assistant. I'm here to help you set up and monitor your child's online safety. What would you like to know about?");
  
  // Add suggestion buttons
  const suggestions = document.createElement('div');
  suggestions.className = 'suggestion-buttons';
  suggestions.innerHTML = `
    <button onclick="handleParentSuggestion('settings')">Safety Settings</button>
    <button onclick="handleParentSuggestion('monitoring')">Monitoring Tips</button>
    <button onclick="handleParentSuggestion('conversations')">Having Security Conversations</button>
  `;
  
  chatDiv.appendChild(suggestions);
  chatDiv.scrollTop = chatDiv.scrollHeight;
}

// Handle parent suggestion clicks
function handleParentSuggestion(type) {
  // Remove suggestion buttons
  const suggestions = document.querySelector('.suggestion-buttons');
  if (suggestions) {
    suggestions.remove();
  }
  
  // Add user message
  const messageText = {
    'settings': "Tell me about safety settings for my child.",
    'monitoring': "What are some good monitoring practices?",
    'conversations': "How can I talk to my child about online safety?"
  }[type];
  
  addUserMessage(messageText);
  
  // Show thinking animation
  addThinkingAnimation();
  
  // Generate response after a short delay
  setTimeout(() => {
    // Remove thinking animation
    const thinkingElement = document.querySelector('.thinking');
    if (thinkingElement) {
      thinkingElement.remove();
    }
    
    // Display response based on type
    let response = '';
    
    if (type === 'settings') {
      response = "Here are some effective safety settings for your child:\n\n" +
                "1. Enable parental controls on all devices (phones, tablets, computers, gaming consoles)\n" +
                "2. Use content filters to block inappropriate websites and content\n" +
                "3. Set up app store restrictions to prevent unauthorized downloads\n" +
                "4. Enable safe search on search engines\n" +
                "5. Set screen time limits and device curfews\n" +
                "6. Consider using a family-focused router with built-in protections\n\n" +
                "Remember to update these settings as your child grows and gains more digital maturity.";
    } else if (type === 'monitoring') {
      response = "Effective monitoring balances safety with privacy and trust:\n\n" +
                "1. Keep devices in common areas of the home, not in bedrooms\n" +
                "2. Regularly check browsing history and app usage together with your child\n" +
                "3. Friend/follow your child on social media (with their knowledge)\n" +
                "4. Use monitoring tools appropriate for your child's age\n" +
                "5. Establish check-in times for discussing online activities\n" +
                "6. Watch for warning signs like secrecy or anxiety around devices\n\n" +
                "As your child gets older, gradually adjust monitoring to respect their growing independence.";
    } else {
      response = "Here's how to have effective cybersecurity conversations with your child:\n\n" +
                "1. Start early and keep conversations age-appropriate\n" +
                "2. Focus on open communication rather than fear\n" +
                "3. Use real-life examples they can relate to\n" +
                "4. Establish clear rules and consequences\n" +
                "5. Be a good digital role model yourself\n" +
                "6. Create a safe space where they can come to you if they encounter problems\n" +
                "7. Praise good digital decisions\n\n" +
                "Remember, the goal is to teach critical thinking skills, not just rules.";
    }
    
    addBotMessage(response);
    
    // Add follow-up suggestion buttons
    const newSuggestions = document.createElement('div');
    newSuggestions.className = 'suggestion-buttons';
    newSuggestions.innerHTML = `
      <button onclick="handleParentSuggestion('settings')">Safety Settings</button>
      <button onclick="handleParentSuggestion('monitoring')">Monitoring Tips</button>
      <button onclick="handleParentSuggestion('conversations')">Having Security Conversations</button>
    `;
    
    chatDiv.appendChild(newSuggestions);
    chatDiv.scrollTop = chatDiv.scrollHeight;
  }, 1500);
}

// Start mission
function startMission(missionId) {
  // Set active mission
  activeMission = missionId;
  
  // Transition to chat screen
  transitionToScreen(userDashboard, chatScreen);
  
  // Initialize chat for mission
  initializeChatForMission(missionId);
}

// Initialize chat for mission
function initializeChatForMission(missionId) {
  // Set chat avatar based on age group
  let avatarSrc = '';
  
  if (userAgeGroup === 'child') {
    avatarSrc = 'cyber_cat_kid.png';
  } else if (userAgeGroup === 'teen') {
    avatarSrc = 'cyber_cat_teen.png';
  } else if (userAgeGroup === 'adult') {
    avatarSrc = 'cyber_cat.png';
  } else {
    avatarSrc = 'cyber_cat_senior.png';
  }
  
  document.getElementById('chatAvatar').src = avatarSrc;
  
  // Clear previous messages
  chatDiv.innerHTML = '';
  
  // Add mission intro
  const mission = missions[missionId];
  let intro = '';
  
  if (missionId === 'passwords') {
    intro = `Welcome to the Password Protector mission, ${userName}! Strong passwords are your first line of defense online. Let's see how we can improve your password security.`;
  } else if (missionId === 'privacy') {
    intro = `Hello ${userName}! In this Privacy Guardian mission, we'll explore how to protect your personal information online and control what others can see about you.`;
  } else if (missionId === 'phishing') {
    intro = `Ready to become a Phishing Detective, ${userName}? Phishing attacks try to trick you into revealing personal information. Let's learn how to spot and avoid them!`;
  } else if (missionId === 'updates') {
    intro = `Welcome to the Update Master mission, ${userName}! Regular updates are crucial for security. Let's discover why they matter and how to stay updated.`;
  } else if (missionId === 'online_safety') {
    intro = `Hi ${userName}! In this Safe Explorer mission, we'll learn how to navigate the web safely and recognize potential dangers before they become problems.`;
  }
  
  addBotMessage(intro);
  
  // Start first task after a short delay
  setTimeout(() => {
    startMissionTask(missionId, 0);
  }, 1500);
}

// Start mission task
function startMissionTask(missionId, taskIndex) {
  const mission = missions[missionId];
  
  if (taskIndex >= mission.tasks.length) {
    // Mission completed
    completeMission(missionId);
    return;
  }
  
  const task = mission.tasks[taskIndex];
  
  // Ask task question
  addBotMessage(task.question);
  
  // Add response buttons
  const responseButtons = document.createElement('div');
  responseButtons.className = 'response-buttons';
  responseButtons.innerHTML = `
    <button onclick="handleMissionResponse('${missionId}', ${taskIndex}, 'yes')">Yes</button>
    <button onclick="handleMissionResponse('${missionId}', ${taskIndex}, 'no')">No</button>
    <button onclick="handleMissionResponse('${missionId}', ${taskIndex}, 'not_sure')">Not Sure</button>
  `;
  
  chatDiv.appendChild(responseButtons);
  chatDiv.scrollTop = chatDiv.scrollHeight;
}

// Handle mission response
function handleMissionResponse(missionId, taskIndex, response) {
  // Remove response buttons
  const responseButtons = document.querySelector('.response-buttons');
  if (responseButtons) {
    responseButtons.remove();
  }
  
  // Display user's response
  const responseText = {
    'yes': "Yes, I do!",
    'no': "No, not really.",
    'not_sure': "I'm not sure."
  }[response];
  
  addUserMessage(responseText);
  
  // Show thinking animation
  addThinkingAnimation();
  
  // Generate response after a short delay
  setTimeout(() => {
    // Remove thinking animation
    const thinkingElement = document.querySelector('.thinking');
    if (thinkingElement) {
      thinkingElement.remove();
    }
    
    // Mark task as completed
    missions[missionId].tasks[taskIndex].completed = true;
    
    // Calculate mission progress
    const completedTasks = missions[missionId].tasks.filter(task => task.completed).length;
    const totalTasks = missions[missionId].tasks.length;
    missions[missionId].progress = Math.floor((completedTasks / totalTasks) * 100);
    
    // Update security score
    updateScore(10);
    
    // Get tips based on the response and age group
    let tips = missions[missionId].tips[userAgeGroup] || missions[missionId].tips.adult;
    let tip = tips[taskIndex % tips.length];
    
    let response = '';
    
    if (responseText === "Yes, I do!") {
      response = `That's great! ${tip}`;
    } else if (responseText === "No, not really.") {
      response = `That's okay, this is a good opportunity to improve. ${tip}`;
    } else {
      response = `Let me help you understand this better. ${tip}`;
    }
    
    addBotMessage(response);
    
    // Move to next task after a delay
    setTimeout(() => {
      startMissionTask(missionId, taskIndex + 1);
    }, 2000);
  }, 1500);
}


// Complete mission
function completeMission(missionId) {
  // Update the mission card
  completedMissions++;
  
  // Show mission completion message
  addBotMessage(`Congratulations, ${userName}! You've completed the ${missions[missionId].title} mission! Your security knowledge is growing stronger. 🎉`);
  
  // Add suggestion buttons
  const suggestions = document.createElement('div');
  suggestions.className = 'suggestion-buttons';
  suggestions.innerHTML = `
    <button onclick="returnToDashboard()">Return to Dashboard</button>
    <button onclick="startRandomMission()">Try Another Mission</button>
  `;
  
  chatDiv.appendChild(suggestions);
  chatDiv.scrollTop = chatDiv.scrollHeight;
  
  // Update mission card in dashboard
  updateMissionCard(missionId);
}

// Update mission card in dashboard
function updateMissionCard(missionId) {
  const missionCard = document.querySelector(`.mission-card[data-mission="${missionId}"]`);
  if (!missionCard) return;
  
  const progressBar = missionCard.querySelector('.mission-progress-bar');
  const statusText = missionCard.querySelector('.mission-status span:first-child');
  const tasksText = missionCard.querySelector('.mission-status span:last-child');
  const actionButton = missionCard.querySelector('.mission-action');
  
  const mission = missions[missionId];
  const completedTasks = mission.tasks.filter(task => task.completed).length;
  const totalTasks = mission.tasks.length;
  const progress = Math.floor((completedTasks / totalTasks) * 100);
  
  progressBar.style.width = `${progress}%`;
  statusText.textContent = `${progress}% ${progress === 100 ? '🎉' : '🚧'}`;
  tasksText.textContent = `${completedTasks}/${totalTasks} ${completedTasks === totalTasks ? '✅' : '📝'}`;
  
  if (progress === 100) {
    actionButton.textContent = 'Completed';
    actionButton.classList.add('completed');
  }
}

// Start a random mission
function startRandomMission() {
  const missionKeys = Object.keys(missions);
  const availableMissions = missionKeys.filter(key => {
    return missions[key].progress < 100;
  });
  
  if (availableMissions.length === 0) {
    addBotMessage("Amazing! You've completed all the security missions. You're now a cybersecurity expert! 🏆");
    
    setTimeout(() => {
      returnToDashboard();
    }, 2000);
    return;
  }
  
  const randomIndex = Math.floor(Math.random() * availableMissions.length);
  const randomMission = availableMissions[randomIndex];
  
  startMission(randomMission);
}

// Return to dashboard
function returnToDashboard() {
  transitionToScreen(chatScreen, userDashboard);
}

// Show error message
function showError(elementId, message) {
  const errorElement = document.getElementById(elementId);
  errorElement.textContent = message;
  errorElement.classList.remove('hidden');
  
  setTimeout(() => {
    errorElement.classList.add('hidden');
  }, 3000);
}

// Transition between screens
function transitionToScreen(fromScreen, toScreen) {
  fromScreen.classList.add('fade-out');
  
  setTimeout(() => {
    fromScreen.classList.add('hidden');
    fromScreen.classList.remove('fade-out');
    
    toScreen.classList.add('fade-in');
    toScreen.classList.remove('hidden');
    
    setTimeout(() => {
      toScreen.classList.remove('fade-in');
    }, 300);
  }, 300);
}

// Add bot message to chat
function addBotMessage(message) {
  const messageDiv = document.createElement('div');
  messageDiv.className = 'message bot-message';
  
  const avatar = document.createElement('div');
  avatar.className = 'message-avatar';
  avatar.innerHTML = `<img src="${document.getElementById('chatAvatar').src}" alt="Cyber Cat">`;
  
  const content = document.createElement('div');
  content.className = 'message-content';
  
  // Convert newlines to <br> tags
  const formattedMessage = message.replace(/\n/g, '<br>');
  content.innerHTML = formattedMessage;
  
  messageDiv.appendChild(avatar);
  messageDiv.appendChild(content);
  
  chatDiv.appendChild(messageDiv);
  chatDiv.scrollTop = chatDiv.scrollHeight;
}

// Add user message to chat
function addUserMessage(message) {
  const messageDiv = document.createElement('div');
  messageDiv.className = 'message user-message';
  
  const content = document.createElement('div');
  content.className = 'message-content';
  content.textContent = message;
  
  messageDiv.appendChild(content);
  
  chatDiv.appendChild(messageDiv);
  chatDiv.scrollTop = chatDiv.scrollHeight;
}

// Add thinking animation
function addThinkingAnimation() {
  const thinkingDiv = document.createElement('div');
  thinkingDiv.className = 'message bot-message thinking';
  
  const avatar = document.createElement('div');
  avatar.className = 'message-avatar';
  avatar.innerHTML = `<img src="${document.getElementById('chatAvatar').src}" alt="Cyber Cat">`;
  
  const content = document.createElement('div');
  content.className = 'message-content';
  content.innerHTML = '<span class="dot"></span><span class="dot"></span><span class="dot"></span>';
  
  thinkingDiv.appendChild(avatar);
  thinkingDiv.appendChild(content);
  
  chatDiv.appendChild(thinkingDiv);
  chatDiv.scrollTop = chatDiv.scrollHeight;
}

// Update security score
function updateScore(increment) {
  securityScore += increment;
  if (securityScore > 100) securityScore = 100;
  
  const scorePercentage = securityScore;
  
  // Update score displays
  scoreDisplay.textContent = `${scorePercentage}/100`;
  dashboardScore.textContent = `${scorePercentage}/100`;
  
  // Update progress bars with animation
  progressBar.style.width = `${scorePercentage}%`;
  dashboardProgress.style.width = `${scorePercentage}%`;
  
  progressBar.classList.add('progress-animate');
  dashboardProgress.classList.add('progress-animate');
  
  setTimeout(() => {
    progressBar.classList.remove('progress-animate');
    dashboardProgress.classList.remove('progress-animate');
  }, 1000);
}

// Load TensorFlow.js QnA model
async function loadModel() {
  try {
    console.log('Loading TensorFlow.js QnA model...');
    model = await qna.load();
    console.log('Model loaded successfully');
  } catch (error) {
    console.error('Error loading model:', error);
  }
}

// Enhanced AI response system
async function getAnswer(question) {
  // First try to match with mission content
  const missionMatch = findAnswerInMissions(question);
  if (missionMatch) return missionMatch;
  
  // Then try to categorize the question
  const category = categorizeQuestion(question);
  const ageSpecificTips = getAgeSpecificTips(category);
  
  // If we have good tips, use them
  if (ageSpecificTips && ageSpecificTips.length > 0) {
    return formatResponse(question, ageSpecificTips);
  }
  
  // Final fallback
  return getFallbackResponse(category);
}

function findAnswerInMissions(question) {
  const questionLower = question.toLowerCase();
  
  // Search through all missions and tasks
  for (const missionKey in missions) {
    const mission = missions[missionKey];
    
    // Check mission title
    if (mission.title.toLowerCase().includes(questionLower)) {
      const tips = mission.tips[userAgeGroup] || mission.tips.adult;
      return `About ${mission.title}: ${tips[0]}`;
    }
    
    // Check tasks
    for (const task of mission.tasks) {
      if (task.question.toLowerCase().includes(questionLower)) {
        const tips = mission.tips[userAgeGroup] || mission.tips.adult;
        return `For "${task.question}": ${tips[Math.floor(Math.random() * tips.length)]}`;
      }
    }
  }
  
  return null;
}

function categorizeQuestion(question) {
  const questionLower = question.toLowerCase();
  const categories = {
    passwords: ['password', 'login', 'account', 'secure'],
    privacy: ['privacy', 'data', 'information', 'personal'],
    phishing: ['phish', 'scam', 'email', 'click', 'link'],
    updates: ['update', 'software', 'app', 'patch'],
    social: ['social', 'media', 'facebook', 'instagram', 'tiktok'],
    general: ['safe', 'security', 'protect', 'internet']
  };
  
  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => questionLower.includes(keyword))) {
      return category;
    }
  }
  
  return 'general';
}

function getAgeSpecificTips(category) {
  // Check if we have fallback responses for this category
  if (fallbackResponses[userAgeGroup] && fallbackResponses[userAgeGroup][category]) {
    return fallbackResponses[userAgeGroup][category];
  }
  
  // Check mission tips
  for (const mission of Object.values(missions)) {
    if (mission.title.toLowerCase().includes(category) && mission.tips[userAgeGroup]) {
      return mission.tips[userAgeGroup];
    }
  }
  
  return null;
}

function formatResponse(question, tips) {
  const responses = [
    `For "${question}", here's what you should know: ${tips[0]}`,
    `Great question! ${tips[Math.floor(Math.random() * tips.length)]}`,
    `About that: ${tips[Math.floor(Math.random() * tips.length)]}`,
    `Security tip: ${tips[Math.floor(Math.random() * tips.length)]}`
  ];
  
  return responses[Math.floor(Math.random() * responses.length)];
}

function getFallbackResponse(category) {
  const genericTips = {
    passwords: "A strong password should be unique and hard to guess. Consider using a password manager!",
    privacy: "Always think before sharing personal information online. Less is more when it comes to privacy.",
    phishing: "If an email or message seems suspicious, don't click any links. Verify with the sender directly.",
    updates: "Keeping your software updated is one of the best ways to stay secure online.",
    social: "Be mindful of what you share on social media. Once it's online, it's hard to take back.",
    general: "Online security is about being careful and thinking before you act. When in doubt, ask for help!"
  };
  
  return genericTips[category] || 
    "That's an interesting question! Cybersecurity is all about being careful and thinking before you act online.";
}








// Request notification permission
function requestNotificationPermission() {
  if ('Notification' in window) {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        console.log('Notification permission granted');
        // Send a welcome notification
        setTimeout(() => {
          new Notification('Welcome to Cyber Cat!', {
            body: 'Thank you for enabling notifications. I\'ll send you security tips and reminders!',
            icon: 'cyber_cat.png'
          });
        }, 1000);
      }
    });
  }
}

// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js')
      .then(registration => {
        console.log('ServiceWorker registered with scope:', registration.scope);
      })
      .catch(error => {
        console.error('ServiceWorker registration failed:', error);
      });
  });
}

// PWA installation prompt
window.addEventListener('beforeinstallprompt', e => {
  // Prevent the default install prompt
  e.preventDefault();
  
  // Save the event for later use
  deferredPrompt = e;
  
  // Show custom install prompt after a delay
  setTimeout(() => {
    if (!isInstallPromptShown) {
      installPrompt.classList.remove('hidden');
      isInstallPromptShown = true;
    }
  }, 60000); // Show after 1 minute of using the app
});

// Handle keyboard input for chat
document.addEventListener('keydown', function(e) {
  // Check if chat screen is visible and input is focused
  const chatInputBox = document.getElementById('chatInput');
  
  if (!chatScreen.classList.contains('hidden') && chatInputBox === document.activeElement && e.key === 'Enter') {
    e.preventDefault();
    sendUserMessage();
  }
});

// Add chat input functionality
function initializeChatInput() {
  // Create chat input form if it doesn't exist
  if (!document.getElementById('chatInputForm')) {
    const inputForm = document.createElement('form');
    inputForm.id = 'chatInputForm';
    inputForm.className = 'chat-input-form';
    
    inputForm.innerHTML = `
      <input type="text" id="chatInput" placeholder="Type your security question...">
      <button type="submit" id="sendButton">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="22" y1="2" x2="11" y2="13"></line>
          <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
        </svg>
      </button>
    `;
    
    chatScreen.querySelector('.chat-container').appendChild(inputForm);
    
    // Add event listener
    inputForm.addEventListener('submit', e => {
      e.preventDefault();
      sendUserMessage();
    });
  }
}

// Send user message
function sendUserMessage() {
  const chatInput = document.getElementById('chatInput');
  const message = chatInput.value.trim();
  
  if (message === '') return;
  
  // Add user message to chat
  addUserMessage(message);
  
  // Clear input
  chatInput.value = '';
  
  // Show thinking animation
  addThinkingAnimation();
  
  // Get response after a short delay
  setTimeout(async () => {
    // Remove thinking animation
    const thinkingElement = document.querySelector('.thinking');
    if (thinkingElement) {
      thinkingElement.remove();
    }
    
    // Get response from model
    const response = await getAnswer(message);
    
    // Add bot response
    addBotMessage(response);
    
    // Update security score for asking a question
    updateScore(1);
    
    // Return focus to input
    chatInput.focus();
  }, 1500);
}

// Track activity time
setInterval(() => {
  if (startTime) {
    const now = new Date();
    const timeElapsed = Math.floor((now - startTime) / 60000); // in minutes
    
    // Update time spent if parent dashboard is visible
    if (!parentDashboard.classList.contains('hidden')) {
      timeSpent.textContent = `${timeElapsed} min`;
    }
  }
}, 60000); // Update every minute

// Initialize chat input when switching to chat screen
const chatScreenObserver = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
      if (!chatScreen.classList.contains('hidden')) {
        initializeChatInput();
        document.getElementById('chatInput').focus();
      }
    }
  });
});

chatScreenObserver.observe(chatScreen, { attributes: true });

// Initialize global event handlers for the chat functionality
document.addEventListener('click', (e) => {
  // Handle clicks outside any specific handlers
  if (e.target.closest('.mission-card')) {
    const card = e.target.closest('.mission-card');
    const missionId = card.getAttribute('data-mission');
    
    // Handle case where the click wasn't on the button but elsewhere on the card
    if (!e.target.closest('.mission-action')) {
      // Toggle mission details or similar action
      card.classList.toggle('expanded');
    }
  }
});

function initializeParentDashboard() {
  // Set up initial data
  const score = calculateChildScore();
  const completed = countCompletedMissions();
  const time = calculateTimeSpent();
  
  // Update UI
  parentScoreDisplay.textContent = `${score}/100`;
  parentProgressBar.style.width = `${score}%`;
  missionsCompleted.textContent = `${completed}/${Object.keys(missions).length}`;
  missionProgressBar.style.width = `${(completed / Object.keys(missions).length) * 100}%`;
  timeSpent.textContent = `${time} min`;
  
  // Add animation
  parentProgressBar.classList.add('progress-animate');
  missionProgressBar.classList.add('progress-animate');
  
  setTimeout(() => {
    parentProgressBar.classList.remove('progress-animate');
    missionProgressBar.classList.remove('progress-animate');
  }, 1000);
  
  // Generate risk assessment
  generateRiskAssessment();
}

function calculateChildScore() {
  let totalPossible = 0;
  let earned = 0;
  
  for (const mission of Object.values(missions)) {
    totalPossible += mission.tasks.length * 10;
    earned += mission.tasks.filter(t => t.completed).length * 10;
  }
  
  return Math.floor((earned / totalPossible) * 100) || 0;
}

function countCompletedMissions() {
  return Object.values(missions).filter(mission => 
    mission.tasks.every(task => task.completed)
  ).length;
}

function generateRiskAssessment() {
  const riskList = document.querySelector('.risk-list');
  riskList.innerHTML = '';
  
  // Generate risks based on incomplete missions
  for (const [missionId, mission] of Object.entries(missions)) {
    const incompleteTasks = mission.tasks.filter(t => !t.completed);
    if (incompleteTasks.length > 0) {
      const riskLevel = Math.random() > 0.7 ? 'high' : (Math.random() > 0.4 ? 'medium' : 'low');
      const riskItem = document.createElement('li');
      riskItem.className = `risk-item risk-${riskLevel}`;
      
      riskItem.innerHTML = `
        <div class="risk-header">
          <span class="risk-title">${mission.title}</span>
          <span class="risk-badge badge-${riskLevel}">${riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)} Risk</span>
        </div>
        <p>Your child hasn't completed ${incompleteTasks.length} of ${mission.tasks.length} tasks in this area. 
        ${getParentSuggestion(missionId, riskLevel)}</p>
      `;
      
      riskList.appendChild(riskItem);
    }
  }
}

function getParentSuggestion(missionId, riskLevel) {
  const suggestions = {
    passwords: {
      high: "Consider discussing password security and setting up a family password manager.",
      medium: "Review password practices together and enable two-factor authentication where possible.",
      low: "A quick reminder about password security might be helpful."
    },
    privacy: {
      high: "Have a conversation about what information should stay private online.",
      medium: "Review privacy settings on their devices and social media accounts together.",
      low: "A gentle reminder about privacy might be appropriate."
    },
    phishing: {
      high: "This is critical - practice identifying phishing attempts with real examples.",
      medium: "Share some recent phishing examples and discuss how to spot them.",
      low: "Consider a quick refresher on phishing awareness."
    },
    updates: {
      high: "Help them set up automatic updates on all their devices.",
      medium: "Check if their devices and apps are up to date together.",
      low: "A reminder about the importance of updates might help."
    },
    online_safety: {
      high: "Discuss safe browsing habits and consider enabling content filters.",
      medium: "Review their browsing history together and discuss safe sites.",
      low: "A quick chat about online safety could be beneficial."
    }
  };
  
  return suggestions[missionId]?.[riskLevel] || "This is an important area to discuss with your child.";
}

function calculateTimeSpent() {
  return Math.floor((new Date() - startTime) / 60000); // Minutes
}




