import test from "node:test";
import assert from "node:assert/strict";
import { isSupportedTeamsHostname } from "./teams-hostnames.js";

test("accepts both supported Teams web app hostnames", () => {
  assert.equal(isSupportedTeamsHostname("teams.microsoft.com"), true);
  assert.equal(isSupportedTeamsHostname("teams.cloud.microsoft"), true);
  assert.equal(isSupportedTeamsHostname("TEAMS.CLOUD.MICROSOFT"), true);
});

test("rejects unsupported Teams-related hostnames", () => {
  assert.equal(isSupportedTeamsHostname("foo.teams.microsoft.com"), false);
  assert.equal(isSupportedTeamsHostname("teams.microsoft.com.evil.example"), false);
  assert.equal(isSupportedTeamsHostname("asyncgw.teams.microsoft.com"), false);
  assert.equal(isSupportedTeamsHostname("example.com"), false);
});
