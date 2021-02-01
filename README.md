# GitHub Champion

## What it will do

The actor will go to the specified repositories and scrape information about who has done the most additions/deletions/commits, as well as closed the most issues and pull requests in a given time period. The person with the highest numbers is the winner - the repository's GitHub Champion.

The actor will need login credentials with access to the repositories if they are private.

The actor should send a notification, if possible to Slack/somewhere else. Maybe this can be done via webhooks?

## How to use

You will need a GitHub API token with the **repo** thingy granted  - find it at <https://github.com/settings/tokens/new>

## Inputs

- Repo(s) - startUrl, add as many as you want
- Initial cookies (optional - only if you're scraping private repos)
- [Time period](https://docs.github.com/en/github/searching-for-information-on-github/understanding-the-search-syntax)
  - Options: this month, last month, date range (YYYY-MM-DD format)
- Contributions - tick boxes
  - Commits
  - Additions
  - Deletions
  - Created PRs
  - [Reviewed PRs](https://docs.github.com/en/github/searching-for-information-on-github/searching-issues-and-pull-requests#search-by-pull-request-review-status-and-reviewer)
  - Closed issues
- Ranking mode
  - Only one champion
  - Top 3
- Output options:
  - Just the champion/top 3
  - A table with everyone's results, sorted by

### Output

For each repo, either one champion or the top 3, with their

See "Output options" above

# Blog notes

Here at Apify, we like to have fun. We work to maintain a team spirit. When we go on a team building, we go hard.

In the spirit of good team humour, we made this fun tool that creates a slightly humorous competition that isn't a competition for your team.
