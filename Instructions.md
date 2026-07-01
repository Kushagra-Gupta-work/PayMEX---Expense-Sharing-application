Prompt 5:-

Create a React app using Vite (npm create vite@latest frontend -- --template react).

Install: react-router-dom, axios, tailwindcss (with postcss and autoprefixer).

Set up Tailwind.

Create an axios instance in src/api/axios.js that:

\- Has baseURL from VITE\_API\_URL environment variable

\- Has a request interceptor that reads token from localStorage and adds 

&#x20; "Authorization: Bearer <token>" header if it exists



Create an AuthContext in src/context/AuthContext.jsx that:

\- Stores user and token in state

\- On mount, checks localStorage for existing token and fetches /api/auth/me to restore session

\- Provides login(token, user), logout() functions

\- Exposes: user, token, isAuthenticated, login, logout, loading



Wrap App with AuthContext in main.jsx.



**PROMPT -6: AUTH PAGES**
Using the existing AuthContext and axios instance, create:



src/pages/Login.jsx:

\- Form with email and password fields (controlled inputs, no HTML form tag, use div + button)

\- On submit: POST to /api/auth/login, call context login() with token and user, 

&#x20; redirect to /dashboard

\- Link to /signup page

\- Show error message on failure



src/pages/Signup.jsx:

\- Form with name, email, password fields

\- On submit: POST to /api/auth/signup, call context login(), redirect to /dashboard

\- Link to /login page



src/components/PrivateRoute.jsx:

\- Wrapper component that redirects to /login if not authenticated (check AuthContext)

\- Shows loading spinner while auth is being restored



Set up React Router in App.jsx:

/ → redirect to /dashboard

/login → Login page

/signup → Signup page

/dashboard → Dashboard page (PrivateRoute) \[placeholder for now]

/groups/:groupId → Group page (PrivateRoute) \[placeholder for now]

**PROMPT 7:- DASHBOARD PAGE**
Create src/pages/Dashboard.jsx:

\- On mount, fetch GET /api/groups and display all user's groups as cards

\- Each card shows: group name, number of members, link to /groups/:groupId

\- "Create Group" button that opens a modal/form:

&#x20; - Input for group name

&#x20; - Textarea for member emails (comma-separated)

&#x20; - On submit: POST /api/groups with { name, memberEmails: emailsArray }

&#x20; - Refresh group list on success

\- Show loading state while fetching

\- Show empty state ("No groups yet — create one!") if no groups

\- Navbar with user's name and a Logout button that calls context logout() and redirects to /login

**PROMPT -8: GROUP DETAIL PAGE**
Create src/pages/GroupPage.jsx (route: /groups/:groupId):



Split into three sections/tabs: Expenses | Balances | Settle Up



Expenses tab:

\- Fetch GET /api/groups/:groupId/expenses, list them (description, amount, who paid, date)

\- "Add Expense" form/modal:

&#x20; - Fields: description, amount, paidBy (dropdown of group members), 

&#x20;   splitType toggle (equal/custom)

&#x20; - If custom: show each member with an amount input, validate they sum to total in real time

&#x20; - On submit: POST /api/groups/:groupId/expenses

&#x20; - Refresh expense list on success



Balances tab:

\- Fetch GET /api/groups/:groupId/balances

\- Show each member's net balance: green if positive (they're owed money), 

&#x20; red if negative (they owe money), grey if zero (settled)



Settle Up tab:

\- Same fetch as Balances tab (use cached data, don't refetch)

\- Show each settlement transaction as a card: 

&#x20; "\[Person A] pays \[Person B] ₹\[amount]"

\- "Add Member" button: input for email, POST /api/groups/:groupId/members



Back button to /dashboard.

**PROMPT -9 : POLISH AND DEPLOY**
1. Add error boundary or try/catch error states to all pages

2\. Add a 401 response interceptor to the axios instance that calls logout() 

&#x20;  and redirects to /login when token expires

3\. Add a .env file for frontend with VITE\_API\_URL=http://localhost:5000

4\. Add a README.md with:

&#x20;  - Project description

&#x20;  - How the debt simplification algorithm works (explain with an example)

&#x20;  - Tech stack

&#x20;  - How to run locally (backend + frontend steps)

&#x20;  - Screenshots or a demo link



For deployment:

\- Push full project to GitHub

\- Deploy backend to Render.com (set MONGO\_URI and JWT\_SECRET env vars)

\- Deploy frontend to Vercel (set VITE\_API\_URL to your Render backend URL)

