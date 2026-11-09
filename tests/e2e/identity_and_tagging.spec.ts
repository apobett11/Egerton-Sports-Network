import { test, expect } from '@playwright/test';

test.describe('Session Identity, OP Attributions, and @Team Autocomplete', () => {
  test('Correctly tags OP badges and routes mentions to the team coach inbox', async ({ browser }) => {
    const contextAuthor = await browser.newContext();
    const contextReplier = await browser.newContext();

    const authorPage = await contextAuthor.newPage();
    const replierPage = await contextReplier.newPage();

    // 1. Author posts root thread
    await authorPage.goto('/#/banter');
    await authorPage.locator('textarea[placeholder*="What\'s happening"]').fill('Derby Tactics: High Pressing');
    await authorPage.locator('button:has-text("Post")').click();

    const rootCard = authorPage.locator('article:has-text("Derby Tactics: High Pressing")').first();
    await rootCard.click();
    const threadUrl = authorPage.url();

    // 2. Replier opens thread and posts reply
    await replierPage.goto(threadUrl);
    await replierPage.locator('textarea[placeholder*="Post your reply"]').fill('Replier comment');
    await replierPage.locator('button:has-text("Reply")').click();

    // Verify Author does not have OP badge on replier's comment
    const replierComment = authorPage.locator('article:has-text("Replier comment")');
    await expect(replierComment.locator('text=OP')).toHaveCount(0);

    // 3. Author replies back inside own thread
    await authorPage.locator('textarea[placeholder*="Post your reply"]').fill('Author follow-up clarification');
    await authorPage.locator('button:has-text("Reply")').click();

    // Author reply MUST have the [OP] badge
    const authorReply = replierPage.locator('article:has-text("Author follow-up clarification")');
    await expect(authorReply.locator('text=OP')).toBeVisible();

    // 4. Test @Team Tagging Autocomplete
    await authorPage.locator('textarea[placeholder*="Post your reply"]').fill('Paging @Eng');
    const autocompleteDropdown = authorPage.locator('div:has-text("Select Team to Tag")').last();
    await expect(autocompleteDropdown).toBeVisible();

    // Select Engineering team
    await authorPage.locator('button:has-text("Engineering FC")').click();
    await expect(authorPage.locator('textarea[placeholder*="Post your reply"]')).toHaveValue(/@Engineering FC/);
    await authorPage.locator('button:has-text("Reply")').click();

    // 5. Verify Tagged Message Lands in Coach Inbox
    const coachContext = await browser.newContext();
    const coachPage = await coachContext.newPage();
    await coachPage.goto('/#/coach/messages');

    // Message must be routed to the coach's message feed
    await expect(coachPage.locator('text=Paging @Engineering FC')).toBeVisible();

    await contextAuthor.close();
    await contextReplier.close();
    await coachContext.close();
  });
});
