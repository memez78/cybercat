// Element refs
const welcomeScreen = document.getElementById('welcomeScreen');
const nameScreen = document.getElementById('nameScreen');
const chatScreen = document.getElementById('chatScreen');
const nameInput = document.getElementById('name');
const ageInput = document.getElementById('age');
const startBtn = document.getElementById('startBtn');
const continueBtn = document.getElementById('continueBtn');
const chatDiv = document.getElementById('chatMessages');
const installPrompt = document.getElementById('installPrompt');
const installBtn = document.getElementById('installButton');
const closeInstall = document.getElementById('closeInstall');
const progressBar = document.getElementById('securityProgress');
const scoreDisplay = document.getElementById('scoreDisplay');

let userName = '', userAge = 0, securityScore = 0;
let deferredPrompt;
let model; // TensorFlow.js QnA model
let userAgeGroup = 'adult'; // Default age group

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

// Load the model when the page is ready
window.addEventListener('DOMContentLoaded', () => {
  // Show welcome screen first
  welcomeScreen.classList.remove('hidden');
  nameScreen.classList.add('hidden');
  chatScreen.classList.add('hidden');
  
  // Start loading the AI model in the background
  loadModel();
});

// 1. Welcome Screen Continue Button
continueBtn.addEventListener('click', () => {
  // Animate transition to name screen
  welcomeScreen.classList.add('fade-out');
  setTimeout(() => {
    welcomeScreen.classList.add('hidden');
    nameScreen.classList.remove('hidden');
    nameScreen.classList.add('fade-in');
  }, 500);
});

// 2. Start button on name screen
startBtn.addEventListener('click', () => {
  userName = nameInput.value.trim();
  userAge = parseInt(ageInput.value, 10);
  
  if (!userName) {
    showError('nameError', 'Please enter your name');
    return;
  }
  
  if (!userAge || userAge < 1 || userAge > 120) {
    showError('ageError', 'Please enter a valid age');
    return;
  }
  
  // Determine age group
  if (userAge < 13) {
    userAgeGroup = 'child';
  } else if (userAge < 20) {
    userAgeGroup = 'teen';
  } else if (userAge < 60) {
    userAgeGroup = 'adult';
  } else {
    userAgeGroup = 'senior';
  }
  
  // Sanitize user input to prevent XSS
  const sanitizedName = document.createElement('div');
  sanitizedName.textContent = userName;
  const safeName = sanitizedName.innerHTML;
  
  // Transition to chat screen
  nameScreen.classList.add('fade-out');
  setTimeout(() => {
    nameScreen.classList.add('hidden');
    chatScreen.classList.remove('hidden');
    chatScreen.classList.add('fade-in');
    
    // Initialize chat with appropriate greeting based on age
    initializeChat(safeName, userAgeGroup);
  }, 500);
});
// 3. Initialize Chat with appropriate greeting
function initializeChat(name, ageGroup) {
  let greeting = '';
  let avatarSrc = '';
  
  // Select avatar and greeting based on age group
  if (ageGroup === 'child') {
    greeting = `Hi there, ${name}! I'm Cyber Cat, and I'm here to help you stay safe while having fun online! 😺`;
    avatarSrc = 'cyber_cat_kid.png';
  } else if (ageGroup === 'teen') {
    greeting = `Hey ${name}! Cyber Cat here. Let's talk about staying safe online in a way that doesn't cramp your style. 😎`;
    avatarSrc = 'cyber_cat_teen.png';
  } else if (ageGroup === 'adult') {
    greeting = `Welcome, ${name}. I'm Cyber Cat, your cybersecurity assistant. Let's discuss how to protect your digital life. 🛡️`;
    avatarSrc = 'cyber_cat.png';
  } else {
    greeting = `Hello ${name}, I'm Cyber Cat. I'm here to help you navigate the digital world safely and with confidence. 🔒`;
    avatarSrc = 'cyber_cat_senior.png';
  }
  
  // Add avatar to chat header
  document.getElementById('chatAvatar').src = avatarSrc;
  
  // Add initial message
  addBotMessage(greeting);
  
  // Ask first question based on age group
  setTimeout(() => {
    askQuestion(ageGroup);
  }, 1000);
}


// 4. Ask question based on age group
function askQuestion(ageGroup) {
  let question = '';
  let topic = '';
  
  if (ageGroup === 'child') {
    question = 'Do you know what to do when you see colorful pop-ups or ads while playing games online?';
    topic = 'online_safety';
  } else if (ageGroup === 'teen') {
    question = 'Do you check privacy settings on your social media accounts?';
    topic = 'social_media';
  } else if (ageGroup === 'adult') {
    question = 'Do you use different passwords for your important accounts?';
    topic = 'passwords';
  } else {
    question = 'Are you familiar with how to spot email or phone scams?';
    topic = 'scams';
  }
  
  addBotMessage(question);
  
  // Add response buttons
  const responseButtons = document.createElement('div');
  responseButtons.className = 'response-buttons';
  responseButtons.innerHTML = `
    <button onclick="handleUserResponse('yes', '${topic}')">Yes</button>
    <button onclick="handleUserResponse('no', '${topic}')">No</button>
    <button onclick="handleUserResponse('sometimes', '${topic}')">Sometimes</button>
  `;
  
  chatDiv.appendChild(responseButtons);
  chatDiv.scrollTop = chatDiv.scrollHeight;
}

// 5. Handle user response
function handleUserResponse(response, topic) {
  // Remove response buttons
  const responseButtons = document.querySelector('.response-buttons');
  if (responseButtons) {
    responseButtons.remove();
  }
  
  // Display user's response
  const responseText = {
    'yes': "Yes, I do!",
    'no': "No, not really.",
    'sometimes': "Sometimes, but not always."
  }[response];
  
  addUserMessage(responseText);
  
  // Prepare context and question based on the topic
  let context = getSecurityContext(topic, userAgeGroup);
  let question = '';
  
  if (response === 'yes') {
    question = `What are some other important things to know about ${topic}?`;
  } else if (response === 'no') {
    question = `Why is ${topic} important and what should I do about it?`;
  } else {
    question = `What are the most important tips about ${topic} that I should follow?`;
  }
  
  // Show thinking animation
  addThinkingAnimation();
  
  // Generate response after a short delay
  setTimeout(async () => {
    // Remove thinking animation
    const thinkingElement = document.querySelector('.thinking');
    if (thinkingElement) {
      thinkingElement.remove();
    }
    
    // Get AI response
    const aiResponse = await getAIResponse(question, context, topic);
    
    // Display the AI response
    addBotMessage(aiResponse);
    
    // Update security score
    updateScore(15);
    
    // Ask a follow-up question after a delay
    setTimeout(() => {
      askFollowUpQuestion(userAgeGroup);
    }, 1500);
  }, 1500);
}

// 6. Add user message to chat
function addUserMessage(text) {
  const messageDiv = document.createElement('div');
  messageDiv.className = 'user-message';
  messageDiv.innerHTML = `<p>${text}</p>`;
  chatDiv.appendChild(messageDiv);
  chatDiv.scrollTop = chatDiv.scrollHeight;
}

// 7. Add bot message to chat
function addBotMessage(text) {
  const messageDiv = document.createElement('div');
  messageDiv.className = 'bot-message';
  messageDiv.innerHTML = `
    <div class="bot-avatar">
      <img src="${document.getElementById('chatAvatar').src}" alt="Cyber Cat">
    </div>
    <div class="message-content">
      <p>${text}</p>
    </div>
  `;
  chatDiv.appendChild(messageDiv);
  chatDiv.scrollTop = chatDiv.scrollHeight;
}

// 8. Add thinking animation
function addThinkingAnimation() {
  const thinkingDiv = document.createElement('div');
  thinkingDiv.className = 'bot-message thinking';
  thinkingDiv.innerHTML = `
    <div class="bot-avatar">
      <img src="${document.getElementById('chatAvatar').src}" alt="Cyber Cat">
    </div>
    <div class="message-content">
      <div class="typing-indicator">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
  `;
  chatDiv.appendChild(thinkingDiv);
  chatDiv.scrollTop = chatDiv.scrollHeight;
}

// 9. Show error message
function showError(elementId, message) {
  const errorElement = document.getElementById(elementId);
  errorElement.textContent = message;
  errorElement.classList.remove('hidden');
  
  // Clear error after 3 seconds
  setTimeout(() => {
    errorElement.classList.add('hidden');
  }, 3000);
}

// 10. Get context based on topic and age group
function getSecurityContext(topic, ageGroup) {
  const contexts = {
    child: {
      passwords: `
        Passwords for kids should be easy for them to remember but hard for others to guess.
        Kids should use a secret word or phrase they like and add numbers. Parents should help kids
        create and remember their passwords. Kids should never share their passwords with friends.
        Kids should tell a trusted adult if someone asks for their password. They should use different
        passwords for different games and apps. Passwords protect their game progress and personal information.
      `,
      online_safety: `
        Children should be careful about pop-ups and ads in games and apps. Many pop-ups try to trick
        kids into clicking them. Some ads might lead to inappropriate content or ask for personal information.
        Kids should ask an adult before clicking any pop-ups. They should never click on flashing or
        colorful ads that say they've won something. Kids should know that legitimate games don't ask for
        personal information through pop-ups. Parents should consider using ad blockers for young children.
        If a game or app shows too many ads, it might not be appropriate for children.
      `,
      updates: `
        Software updates for kids' devices are important because they fix security problems.
        Parents should set devices to update automatically when possible. Updates also add new features
        and make apps and games work better. Out-of-date apps and games might not work properly or could have
        security problems. Kids should tell parents when they see update messages on their devices.
      `
    },
    teen: {
      passwords: `
        Teenagers should use strong, unique passwords for each account. A strong password is at
        least 12 characters and includes letters, numbers, and symbols. Teens should avoid using personal
        information like birthdays or names in passwords. Using the same password for multiple accounts
        is risky. Password managers can help teens create and remember complex passwords. Two-factor
        authentication adds extra security to important accounts. Biometric authentication like
        fingerprints can be convenient and secure for teens.
      `,
      social_media: `
        Teens should regularly check and update privacy settings on social media platforms. They should
        know who can see their posts and personal information. Friend requests from strangers should be
        declined. Location sharing should be limited or turned off. Teens should think before posting
        content that could harm their reputation. Personal information like phone numbers, addresses,
        and school details should not be shared publicly. Teens should know how to report and block
        inappropriate content or harassment. They should be aware that deleted content may still exist
        elsewhere online.
      `,
      privacy: `
        Teens should understand what personal data apps and websites collect about them. Reading
        privacy policies reveals what information is collected and how it's used. Location services
        should only be enabled when necessary. Public Wi-Fi networks can be insecure, and sensitive
        activities should be avoided when using them. Privacy settings should be reviewed regularly
        across all platforms. Data minimization is important - only share what's necessary. Teens
        should understand digital footprints and how they affect future opportunities.
      `
    },
    adult: {
      passwords: `
        Adults should use strong, unique passwords for each account. Password managers can generate
        and store complex passwords securely. Multi-factor authentication adds an essential second
        layer of security. Password sharing across accounts creates significant vulnerabilities.
        Regular password updates are recommended, especially after security breaches. Secure password
        recovery options should be set up. Biometric authentication can complement traditional passwords.
        Password strength should be prioritized for financial, email, and work accounts.
      `,
      phishing: `
        Phishing attempts try to steal sensitive information through deceptive emails, texts, or calls.
        Legitimate organizations never request passwords or sensitive information via email. Suspicious
        links should be verified by hovering over them before clicking. Urgent requests for action
        are often red flags for phishing attempts. Official-looking logos and branding can be easily
        faked. When in doubt, contact the organization directly through official channels. Email
        addresses should be carefully checked for slight misspellings. Phishing attacks are becoming
        increasingly sophisticated and targeted.
      `,
      updates: `
        Regular software updates patch security vulnerabilities in operating systems and applications.
        Automatic updates should be enabled when possible. Updates often include important security
        patches for newly discovered vulnerabilities. Delaying updates leaves systems exposed to known
        security risks. All connected devices should be kept updated, including routers, smart home
        devices, and IoT products. Software that is no longer supported with security updates should
        be replaced. Mobile apps should also be regularly updated. Security updates should take
        priority over feature updates.
      `
    },
    senior: {
      passwords: `
        Seniors should use strong passwords that are difficult to guess but manageable to remember.
        Password managers can help store and generate secure passwords. Writing down passwords is
        acceptable if the list is kept in a secure location away from the computer. Passphrases
        (sequences of random words) can be easier to remember than complex passwords. Sharing
        passwords with trusted family members can be considered for emergency access. Different
        passwords should be used for critical accounts like banking and email. Regular password
        updates are recommended, especially after security incidents.
      `,
      scams: `
        Scammers often target seniors through phone calls, emails, and online. Government agencies
        like the IRS never initiate contact through phone calls demanding immediate payment. Tech
        support scams claim your computer has problems and request remote access. Lottery or sweepstakes
        scams announce winnings that require upfront fees. Grandparent scams impersonate family
        members in emergencies needing money. Romance scams develop relationships before requesting
        financial assistance. Legitimate organizations won't create urgency or fear in communications.
        When in doubt, consult with trusted family members or call organizations directly using
        official numbers.
      `,
      privacy: `
        Seniors should review privacy settings on social media and online accounts regularly.
        Personal information shared online can be used to answer security questions. Public profiles
        can reveal too much information to potential scammers. Location sharing should be limited
        or disabled when not needed. Social media friend requests from unknown people should be
        declined. Privacy policies explain how personal data is collected and used. Using a separate
        email for online shopping and subscriptions can reduce spam. Browser privacy settings can
        be adjusted to increase online privacy.
      `
    }
  };
  
  return contexts[ageGroup]?.[topic] || `
    Cybersecurity involves protecting computers, devices, networks, and data from unauthorized access
    or attacks. Good cybersecurity practices include using strong passwords, enabling two-factor
    authentication, keeping software updated, being cautious of suspicious communications, and
    protecting personal information online. Digital literacy and awareness are important parts of
    staying safe online regardless of age.
  `;
}

// 11. Ask follow-up question
function askFollowUpQuestion(ageGroup) {
  const questions = {
    child: [
      "Do you know what personal information you should never share online?",
      "Has anyone online ever asked you for your name, age, or where you live?",
      "Do you know who to talk to if something online makes you feel uncomfortable?"
    ],
    teen: [
      "Do you think about how your posts might affect you later in life?",
      "Have you ever received a message from someone you don't know?",
      "Do you know how to check if a website is secure before entering information?"
    ],
    adult: [
      "Do you use different passwords for your important accounts?",
      "Have you ever received suspicious emails claiming to be from your bank?",
      "Do you regularly back up your important data?"
    ],
    senior: [
      "Have you ever received calls claiming to be from tech support?",
      "Do you verify the identity of people who contact you asking for information?",
      "Have you shared your online account access with anyone?"
    ]
  };

  const availableQuestions = questions[ageGroup].filter(q => !askedQuestions.includes(q));
 if (availableQuestions.length === 0) {
    showFinalSummary(); // New function to show score/dashboard
    return;
  }

  const randomQuestion = availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
  askedQuestions.push(randomQuestion);
  
  // Add the follow-up question
  addBotMessage(randomQuestion);
  
  // Add response buttons
  const responseButtons = document.createElement('div');
  responseButtons.className = 'response-buttons';
  responseButtons.innerHTML = `
    <button onclick="handleUserResponse('yes', '${topic}')">Yes</button>
    <button onclick="handleUserResponse('no', '${topic}')">No</button>
    <button onclick="handleUserResponse('sometimes', '${topic}')">Sometimes</button>
  `;
  
  chatDiv.appendChild(responseButtons);
  chatDiv.scrollTop = chatDiv.scrollHeight;
}

// 12. Generate AI response
async function getAIResponse(question, context, topic) {
  if (!model) {
    // If AI model isn't available, use fallback responses
    console.log('AI model not available, using fallback');
    const ageGroupResponses = fallbackResponses[userAgeGroup] || fallbackResponses.adult;
    const topicResponses = ageGroupResponses[topic] || [
      "That's an important security consideration. Make sure to follow best practices!",
      "Staying safe online means being vigilant about your digital security.",
      "I recommend learning more about this security topic to protect yourself better."
    ];
    return topicResponses[Math.floor(Math.random() * topicResponses.length)];
  }
  
  try {
    console.log('Asking AI:', question);
    console.log('Context:', context);
    
    // Use the QnA model to find an answer based on the context
    const answers = await model.findAnswers(question, context);
    
    console.log('AI answers:', answers);
    
    if (answers && answers.length > 0) {
      // If we got valid answers, use the best one
      return answers[0].text;
    } else {
      // Fall back to predefined responses if no good answer
      const ageGroupResponses = fallbackResponses[userAgeGroup] || fallbackResponses.adult;
      const topicResponses = ageGroupResponses[topic] || [
        "That's an important security consideration. Make sure to follow best practices!",
        "Staying safe online means being vigilant about your digital security.",
        "I recommend learning more about this security topic to protect yourself better."
      ];
      return topicResponses[Math.floor(Math.random() * topicResponses.length)];
    }
  } catch (error) {
    console.error('AI response error:', error);
    
    // Use fallback if there's an error
    const ageGroupResponses = fallbackResponses[userAgeGroup] || fallbackResponses.adult;
    const topicResponses = ageGroupResponses[topic] || [
      "I'm having trouble processing that. Let's talk about a different security topic!",
      "That's a good question about cybersecurity. The important thing is to stay vigilant.",
      "Internet security is all about being proactive and aware of potential threats."
    ];
    return topicResponses[Math.floor(Math.random() * topicResponses.length)];
  }
}

// 13. Update security score
function updateScore(points) {
  securityScore += points;
  if (securityScore > 100) securityScore = 100;
  
  // Update progress bar
  progressBar.style.width = `${securityScore}%`;
  scoreDisplay.textContent = `${securityScore}/100`;
  
  // Add animation
  progressBar.classList.add('progress-animate');
  setTimeout(() => {
    progressBar.classList.remove('progress-animate');
  }, 1000);
  
  // Send notification if permission granted
  if (Notification.permission === 'granted') {
    new Notification('Cyber Cat Security', {
      body: `Your security score is now ${securityScore}!`,
      icon: 'cyber_cat.png'
    });
  }
}

// 14. Load AI model
async function loadModel() {
  try {
    console.log('Loading AI model...');
    model = await qna.load();
    console.log('AI model loaded successfully.');
  } catch (error) {
    console.error('Failed to load AI model:', error);
  }
}

// 15. PWA Install Prompt
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredPrompt = e;
  installPrompt.classList.remove('hidden');
});

installBtn.onclick = () => {
  installPrompt.classList.add('hidden');
  deferredPrompt.prompt();
  deferredPrompt.userChoice.then(choiceResult => {
    if (choiceResult.outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }
    deferredPrompt = null;
  });
};

closeInstall.onclick = () => installPrompt.classList.add('hidden');

// 16. Request notifications permission after user interaction
startBtn.addEventListener('click', () => {
  if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
    setTimeout(() => {
      Notification.requestPermission();
    }, 10000); // Ask after 10 seconds of interaction
  }
});

// 17. Register Service Worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js')
    .then(reg => console.log('Service Worker registered'))
    .catch(err => console.error('Service Worker registration failed:', err));
}
