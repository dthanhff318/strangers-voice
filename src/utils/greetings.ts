/**
 * Get a random time-based greeting message
 * Returns different greetings based on time of day with variety
 */
export function getTimeBasedGreeting(): string {
  const hour = new Date().getHours();

  const morningGreetings = [
    "Good morning",
    "Rise and shine",
    "Top of the morning",
    "Morning sunshine",
    "Hello morning",
    "Bright and early",
    "Fresh start",
    "New day vibes",
  ];

  const afternoonGreetings = [
    "Good afternoon",
    "Afternoon delight",
    "Hey there",
    "Midday greetings",
    "Hope your day is going well",
    "Afternoon sunshine",
    "Happy afternoon",
    "Good day",
  ];

  const eveningGreetings = [
    "Good evening",
    "Evening vibes",
    "Hey night owl",
    "Sunset greetings",
    "Evening sunshine",
    "Twilight hello",
    "Golden hour",
    "Evening time",
  ];

  const nightGreetings = [
    "Good night",
    "Late night vibes",
    "Burning the midnight oil",
    "Night owl mode",
    "Moonlight greetings",
    "Stars are out",
    "Sleep tight soon",
    "Peaceful night",
  ];

  let greetings: string[];

  if (hour >= 5 && hour < 12) {
    greetings = morningGreetings;
  } else if (hour >= 12 && hour < 17) {
    greetings = afternoonGreetings;
  } else if (hour >= 17 && hour < 21) {
    greetings = eveningGreetings;
  } else {
    greetings = nightGreetings;
  }

  // Return random greeting from the selected array
  return greetings[Math.floor(Math.random() * greetings.length)];
}

/**
 * Get a simple random greeting (not time-based)
 */
export function getRandomGreeting(): string {
  const greetings = [
    "Hello",
    "Hey",
    "Hi there",
    "Howdy",
    "Greetings",
    "Welcome",
    "Hey there",
    "What's up",
    "Yo",
    "Hiya",
  ];

  return greetings[Math.floor(Math.random() * greetings.length)];
}

/**
 * Get a personalized greeting with user's name
 */
export function getPersonalizedGreeting(userName?: string | null): string {
  const greeting = getTimeBasedGreeting();

  if (userName) {
    return `${greeting}, ${userName}`;
  }

  return greeting;
}
