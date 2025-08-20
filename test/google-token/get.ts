const tokenResponse = await fetch("http://localhost:3001/https://oauth2.googleapis.com/token");

if (tokenResponse.status !== 405) throw new Error();
