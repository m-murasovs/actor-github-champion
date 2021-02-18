# GitHub Champion

Metrics aren't fun. What if they could be?

Celebrate your organization's unsung heroes, identify the quiet contributors who make a difference, and see who will dethrone the reigning champion.

Find the top 3 contributors from your organization and each of your repositories for your chosen time period. The winners are decided by number of assigned issues closed, number of PR reviews, and number of PRs opened. In addition, the actor also gathers metrics like additions, deletions, and commits for everyone who contributed to the repo, if you're into more details.

Use Apify [schedules](https://docs.apify.com/schedules) to synchronize these reports with your company's sprints. Combine it with [webhooks](https://docs.apify.com/webhooks) and have the results sent to you right after they are gathered.

Who is your organization's GitHub Champion?

## How to use

To use this actor with private repositories, you will need a GitHub API token with the **repo** permission granted  - create it at <https://github.com/settings/tokens/new> and paste it into the **githubApiToken** input.

If you keep getting a `Not Found` error, it's probably to do with your authentication token. Make sure the entire `repo` permission is selected.

![API token settings](src/images/token_permissions.png)

By default, releases are not counted.

You will also need to make sure issues are **assigned** correctly (it's good practice anyway :)). One of the main metrics for the actor is the **number of issues closed** by each contributor.

## How it works

The actor makes a few requests to GitHub's API to get your repositories' stats. It then crunches the data for each repo and each contributor, discards the empty entries, and returns the goods.

**Closed issues** count for 1 point, **pull request reviews** count for 0.75 pints,  while **created pull requests** count for half a point. The score is added, and the person with the highest score wins!

## What it doesn't do

This actor **doesn't include the number of additions, deletions, and commits** in its calculation. Some of us commit everything, others like to bundle it all into one. Some of us do package updates, which amount to thousands of added and deleted lines.

## Output

The top 3 contributors from each repository are added to the `top-contributors.json` file in the `top-threes` [key-value store](https://docs.apify.com/storage/key-value-store).

Sample top 3 array:

```json
[
  {
    "Organization All-stars": [
      {
        "name": "gandalf",
        "total": 29.5,
        "pullReviews": 25,
        "issuesClosed": 3,
        "pullsCreated": 3
      },
      {
        "name": "samwise",
        "total": 24.5,
        "pullReviews": 16,
        "issuesClosed": 5,
        "pullsCreated": 7
      },
      {
        "name": "frodo",
        "total": 20,
        "pullReviews": 16,
        "issuesClosed": 1,
        "pullsCreated": 6
      }
    ]
  },
  {
    "apify-web": [
      {
        "name": "gandalf",
        "total": 27,
        "pullReviews": 11,
        "issuesClosed": 12,
        "pullsCreated": 8
      },
      {
        "name": "frodo",
        "total": 18.5,
        "pullReviews": 12,
        "issuesClosed": 6,
        "pullsCreated": 1
      },
      {
        "name": "former-champ",
        "total": 10,
        "pullReviews": 10,
        "issuesClosed": 0,
        "pullsCreated": 0
      }
    ]
  },
  {
    "apify-core": [
      {
        "name": "winner",
        "total": 14.5,
        "pullReviews": 10,
        "issuesClosed": 0,
        "pullsCreated": 9
      },
      {
        "name": "hello-user",
        "total": 13,
        "pullReviews": 4,
        "issuesClosed": 7,
        "pullsCreated": 4
      },
      {
        "name": "future-champ",
        "total": 6.5,
        "pullReviews": 6,
        "issuesClosed": 0,
        "pullsCreated": 1
      }
    ]
  }
]
```

More detailed breakdowns of each repository are available in the `detailed-repo-metrics` key-value-store.

Sample detailed breakdown:

```json
[
  {
    "id": "former-champ",
    "additions": 0,
    "deletions": 0,
    "commits": 0,
    "pullsCreated": 0,
    "pullReviews": 10,
    "issuesClosed": 0
  },
  {
    "id": "team-leader",
    "additions": 4,
    "deletions": 2,
    "commits": 1,
    "pullsCreated": 1,
    "pullReviews": 1,
    "issuesClosed": 0
  },
  {
    "id": "cto",
    "additions": 0,
    "deletions": 0,
    "commits": 0,
    "pullsCreated": 0,
    "pullReviews": 6,
    "issuesClosed": 0
  },
  {
    "id": "frodo",
    "additions": 123,
    "deletions": 54,
    "commits": 2,
    "pullsCreated": 1,
    "pullReviews": 12,
    "issuesClosed": 6
  },
  {
    "id": "casual-contributor",
    "additions": 0,
    "deletions": 0,
    "commits": 0,
    "pullsCreated": 0,
    "pullReviews": 5,
    "issuesClosed": 1
  },
  {
    "id": "gandalf",
    "additions": 15652,
    "deletions": 16589,
    "commits": 13,
    "pullsCreated": 8,
    "pullReviews": 11,
    "issuesClosed": 12
  },
  {
    "id": "samwise",
    "additions": 17,
    "deletions": 4,
    "commits": 1,
    "pullsCreated": 1,
    "pullReviews": 0,
    "issuesClosed": 0
  }
]
```
