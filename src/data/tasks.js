// Sample real-world tasks per skillId with concepts tested and AI evaluation criteria.
// Backend ready: will connect to POST /api/task/generate and AI Grader service later.

export const taskBank = {
  react: {
    skillId: "react",
    skillName: "React",
    title: "Build a React form with validation",
    task: "Build a React form with name, email, and password fields that validates input before submission.",
    concepts: ["Components", "State", "Event handling", "Validation"],
    starterCode: `import React, { useState } from 'react';

export default function SignupForm() {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!formData.name) errs.name = 'Name is required';
    if (!formData.email.includes('@')) errs.email = 'Invalid email';
    if (formData.password.length < 6) errs.password = 'Min 6 characters';
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length === 0) {
      console.log('Valid submission', formData);
    } else {
      setErrors(errs);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Complete component implementation */}
    </form>
  );
}`,
    requirements: [
      "Use useState to manage each field's value",
      "Show an inline error when a field is invalid",
      "Disable the submit button until all fields are valid",
      "Implement proper event handling for change and submit",
    ],
    expectedOutput: "A working form component that blocks submission until name, email, and password all pass validation.",
    evaluationCriteria: ["Components", "State", "Event handling", "Validation"],
  },
  nodejs: {
    skillId: "nodejs",
    skillName: "Node.js",
    title: "Build a JSON status API",
    task: "Create a small Node.js HTTP server with a single GET /status route that returns { status: 'ok' } as JSON.",
    concepts: ["HTTP Server", "Routing", "Status Codes", "JSON Headers"],
    starterCode: `const http = require('http');

const server = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok' }));
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not Found' }));
  }
});

server.listen(3000);`,
    requirements: ["Use Node's built-in http module or Express", "Return proper JSON headers", "Handle unknown routes with a 404"],
    expectedOutput: "A server that responds correctly to GET /status and returns a 404 for other paths.",
    evaluationCriteria: ["HTTP Server", "Routing", "Status Codes", "JSON Headers"],
  },
  sql: {
    skillId: "sql",
    skillName: "SQL",
    title: "Write a sales summary query",
    task: "Write a SQL query that returns total revenue per product category, sorted from highest to lowest.",
    concepts: ["JOINs", "GROUP BY", "ORDER BY", "Aggregations"],
    starterCode: `SELECT 
  p.category,
  SUM(o.amount) AS total_revenue
FROM orders o
INNER JOIN products p ON o.product_id = p.id
GROUP BY p.category
ORDER BY total_revenue DESC;`,
    requirements: ["Use a JOIN across orders and products", "Group by category", "Sort by total revenue descending"],
    expectedOutput: "A single SQL query returning category and total_revenue columns, correctly sorted.",
    evaluationCriteria: ["JOINs", "GROUP BY", "ORDER BY", "Aggregations"],
  },
  javascript: {
    skillId: "javascript",
    skillName: "JavaScript",
    title: "Implement an asynchronous retry utility",
    task: "Write a utility function retryAsync(fn, retries, delayMs) that attempts to execute an asynchronous operation and retries upon failure.",
    concepts: ["Promises", "Async/Await", "Error handling", "Timing"],
    starterCode: `async function retryAsync(fn, retries = 3, delayMs = 1000) {
  try {
    return await fn();
  } catch (err) {
    if (retries <= 0) throw err;
    await new Promise((r) => setTimeout(r, delayMs));
    return retryAsync(fn, retries - 1, delayMs * 2);
  }
}`,
    requirements: [
      "Accept an async callback function, maximum retry count, and delay between attempts",
      "Use Promises and setTimeout with exponential backoff or fixed delay",
      "Throw the last caught error if all attempts fail",
    ],
    expectedOutput: "A robust helper that gracefully resolves on successful attempt or rejects with the final error after max retries.",
    evaluationCriteria: ["Promises", "Async/Await", "Error handling", "Timing"],
  },
  html: {
    skillId: "html",
    skillName: "HTML",
    title: "Build an accessible checkout summary modal",
    task: "Code semantic HTML5 markup for an order summary modal dialog with accessible ARIA landmarks.",
    concepts: ["Semantic HTML", "ARIA Landmarks", "Modal Dialog", "Accessibility"],
    starterCode: `<dialog id="checkout-modal" aria-labelledby="modal-title" role="dialog">
  <header>
    <h2 id="modal-title">Order Summary</h2>
  </header>
  <main>
    <ul aria-label="Selected cart items">
      <li>Item 1 - $49.00</li>
    </ul>
  </main>
  <footer>
    <button type="button" aria-label="Confirm purchase">Confirm</button>
  </footer>
</dialog>`,
    requirements: [
      "Use the HTML5 <dialog> element or proper role='dialog'",
      "Provide accessible heading tags and aria-labelledby references",
      "Include keyboard-focusable actions and form elements with explicit labels",
    ],
    expectedOutput: "Standards-compliant semantic markup that passes automated accessibility validation.",
    evaluationCriteria: ["Semantic HTML", "ARIA Landmarks", "Modal Dialog", "Accessibility"],
  },
  css: {
    skillId: "css",
    skillName: "CSS",
    title: "Implement a fluid responsive pricing table",
    task: "Create a modern 3-tier pricing card layout using CSS Grid and Flexbox that transitions cleanly across screen sizes.",
    concepts: ["CSS Grid", "Flexbox", "Media Queries", "Card Layout"],
    starterCode: `.pricing-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}
.pricing-card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  border-radius: 14px;
}`,
    requirements: ["Use CSS Grid for column placement", "Use Flexbox inside cards for equal heights", "Ensure responsiveness without horizontal scroll"],
    expectedOutput: "A fluid responsive 3-column pricing grid.",
    evaluationCriteria: ["CSS Grid", "Flexbox", "Media Queries", "Card Layout"],
  },
  git: {
    skillId: "git",
    skillName: "Git",
    title: "Document a clean git feature-branch release workflow",
    task: "Write a standard Git workflow procedure covering branch naming, conventional commits, rebasing on main, and pull request hygiene.",
    concepts: ["Branching", "Interactive Rebase", "Pull Requests", "Commit Hygiene"],
    starterCode: `# 1. Create feature branch
git checkout -b feat/user-auth main

# 2. Work & commit using conventional style
git add .
git commit -m "feat(auth): add JWT token refresh endpoint"

# 3. Rebase on main before opening PR
git fetch origin main
git rebase origin/main
git push -u origin feat/user-auth`,
    requirements: ["Explain conventional commit syntax", "Describe rebase procedure", "Outline PR merge strategy"],
    expectedOutput: "A clear step-by-step procedure for production teams.",
    evaluationCriteria: ["Branching", "Interactive Rebase", "Pull Requests", "Commit Hygiene"],
  },
};

export function getTaskForSkill(skillId) {
  return taskBank[skillId] || taskBank.react;
}
