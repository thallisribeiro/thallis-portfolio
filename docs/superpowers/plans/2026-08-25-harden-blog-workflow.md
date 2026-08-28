# Blog Publishing Workflow Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the scheduled blog workflow fail visibly, preserve queued work across partial failures, and publish every generated artifact without changing editorial behavior.

**Architecture:** Keep the two existing Node.js entry points and add a small shared process helper for consistent command diagnostics and pending-push recovery. Exercise the real scripts in temporary Git repositories with Node's built-in test runner, replacing only the external Claude process with a controlled executable.

**Tech Stack:** Node.js CommonJS, `node:test`, Git, Windows Task Scheduler.

**Spec:** This plan is the implementation record for the failure observed in `content/publish-log.txt` on 2026-08-25: Claude exited with status 1 after the weekly quota was reached, the diagnostic was lost, and the scheduled task still reported success.

## Global Constraints

- Preserve the user's uncommitted prompt-length edit in `ensure-queue.js`.
- Do not generate, commit, push, or publish a real post during tests.
- Do not add dependencies or a package manager.
- Do not bypass provider quotas or invent credentials.
- Keep an empty queue and an editorial `SKIP` as successful no-op outcomes.
- Treat model, generation, commit, and push failures as nonzero process exits.

---

### Task 1: Regression harness for provider failure

**Files:**
- Create: `test/blog-workflow.test.js`
- Modify: `ensure-queue.js`

**Interfaces:**
- Consumes: the script directory as the blog root and the optional `BLOG_CLAUDE_COMMAND` executable override.
- Produces: observable script exit status and `content/publish-log.txt` diagnostics.

- [x] **Step 1: Write the failing integration test**

Create a temporary blog root with an empty queue, one evergreen topic, a Git repository, and a fake Claude command that prints `weekly limit` to stdout and exits 1. Run the real `ensure-queue.js`; assert exit status 1, assert the log contains `weekly limit`, and assert the queue remains empty.

- [x] **Step 2: Run test to verify it fails**

Run: `node --test test/blog-workflow.test.js`

Expected: FAIL because the current script exits 0 and omits stdout from the diagnostic.

- [x] **Step 3: Implement minimal provider-failure handling**

Allow an explicit Claude executable override, collect `error`, `stderr`, and `stdout`, and return status 1 from `main()` for invocation or output-format failures. Replace unrestricted permissions with safe mode, no tools, no slash commands, strict MCP configuration, and no session persistence.

- [x] **Step 4: Run test to verify it passes**

Run: `node --test test/blog-workflow.test.js`

Expected: PASS for provider diagnostics, nonzero exit, and untouched queue.

### Task 2: Transactional publication and complete artifact staging

**Files:**
- Modify: `test/blog-workflow.test.js`
- Modify: `publish-next.js`
- Create: `blog-workflow.js`

**Interfaces:**
- Consumes: Git upstream state, `content/queue/*.md`, and `generate-blog.js` exit status.
- Produces: a retained queue on failure; a commit containing the post, queue deletion, `blog/`, `feed.xml`, and `sitemap.xml` on success.

- [x] **Step 1: Write failing publication tests**

Run the real publisher in temporary repositories. First use a failing `generate-blog.js` and assert status 1 plus retention of the queue file. Then use a successful generator that writes blog, feed, and sitemap fixtures and assert all artifacts are committed with the queue deletion.

- [x] **Step 2: Run tests to verify they fail**

Run: `node --test test/blog-workflow.test.js`

Expected: FAIL because the current publisher deletes the queue before generation, exits 0 on generation failure, and does not stage feed or sitemap.

- [x] **Step 3: Implement the minimal transaction boundary**

Keep the queue file until static generation succeeds; restore it when commit fails; return status 1 for invalid input, generation, commit, and push failures; stage only the expected post/publication artifacts; centralize process diagnostics.

- [x] **Step 4: Run tests to verify they pass**

Run: `node --test test/blog-workflow.test.js`

Expected: PASS for queue retention, failure status, and committed artifacts.

### Task 3: Pending-push recovery

**Files:**
- Modify: `test/blog-workflow.test.js`
- Modify: `blog-workflow.js`
- Modify: `ensure-queue.js`
- Modify: `publish-next.js`

**Interfaces:**
- Consumes: local Git commits ahead of the configured upstream.
- Produces: a push retry before either script performs new queue work.

- [x] **Step 1: Write the failing recovery test**

Create a temporary repository with a bare upstream and one local commit ahead. Run a workflow entry point and assert the pending commit reaches the upstream before the script exits as a no-op.

- [x] **Step 2: Run test to verify it fails**

Run: `node --test test/blog-workflow.test.js`

Expected: FAIL because no existing entry point retries an earlier failed push.

- [x] **Step 3: Implement one pending-push preflight**

Detect commits ahead of `@{upstream}` and push them before checking or consuming the queue. If detection or push fails, log the complete diagnostic and return status 1 without generating or publishing new work.

- [x] **Step 4: Run tests to verify they pass**

Run: `node --test test/blog-workflow.test.js`

Expected: PASS with the upstream advanced and no duplicate content action.

### Task 4: Full verification and handoff

**Files:**
- Modify: `docs/superpowers/plans/2026-08-25-harden-blog-workflow.md`

**Interfaces:**
- Consumes: completed implementation and Git diff.
- Produces: fresh verification evidence and a precise user-facing change report.

- [x] **Step 1: Run the complete regression suite**

Run: `node --test test/blog-workflow.test.js`

Expected: all tests pass with zero failures.

- [x] **Step 2: Regenerate the current site**

Run: `node generate-blog.js`

Expected: exit 0; every existing post, blog index, topic page, feed, and sitemap are generated.

- [x] **Step 3: Verify the provider boundary without publishing**

Run the local Claude CLI with safe-mode/no-tools flags and a minimal prompt.

Expected while quota is exhausted: exit 1 with the weekly-limit message visible. The real queue scripts must not be run against production during this check.

- [x] **Step 4: Review scope and diff**

Run: `git diff --check` and `git status --short`.

Expected: no whitespace errors; only planned files plus the user's pre-existing `ensure-queue.js` and publish log changes appear.
