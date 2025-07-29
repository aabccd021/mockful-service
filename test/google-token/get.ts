import { expect } from "bun:test";

const tokenResponse = await fetch("http://localhost:3001/https://oauth2.googleapis.com/token");

expect(tokenResponse.status).toEqual(405);
