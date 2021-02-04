const Apify = require('apify');
const { Octokit } = require('@octokit/rest');
require('dotenv').config();

const {
    mergeContributions,
    filterPullsByTimePeriod,
    getUserPullReviews,
    hasContributions,
} = require('./helpers.js');

const { utils: { log } } = Apify;

const octokit = new Octokit({
    auth: process.env.GITHUB_API_TOKEN,
    state: 'all',
    userAgent: 'GitHub Champion v0.0.1',
});

Apify.main(async () => {
    const { REPOSITORIES, REPOSITORY_OWNER, NUMBER_OF_WEEKS } = await Apify.getInput();
    const store = await Apify.openKeyValueStore('github-metrics');

    const todaysDate = new Date();
    const numberOfDays = NUMBER_OF_WEEKS * 7;
    const timePeriodStartDate = new Date(
        todaysDate.getFullYear(),
        todaysDate.getMonth(),
        (todaysDate.getDate() - numberOfDays),
    );

    for (const repository of REPOSITORIES) {
        const repoStats = [];

        console.log(`--- Getting stats for **${repository}**\n`);

        // Get repo contributors
        const { data: contributors } = await octokit.repos.listContributors({
            owner: REPOSITORY_OWNER,
            repo: repository,
        });

        // Get repo contributions
        const { data: contributions } = await octokit.repos.getContributorsStats({
            owner: REPOSITORY_OWNER,
            repo: repository,
        });

        // Get repo pull requests
        const { data: pulls } = await octokit.pulls.list({
            owner: REPOSITORY_OWNER,
            repo: repository,
            state: 'all',
        });

        const pullsCreatedWithinTimePeriod = await filterPullsByTimePeriod(pulls, timePeriodStartDate);

        // Get reviews for each pull
        const pullReviews = [];
        for (const pull of pullsCreatedWithinTimePeriod) {
            const { data: reviews } = await octokit.request(
                'GET /repos/{owner}/{repo}/pulls/{pull_number}/reviews',
                {
                    owner: REPOSITORY_OWNER,
                    repo: repository,
                    pull_number: pull.number,
                },
            );
            pullReviews.push({
                [pull.number]: reviews,
            });
        }

        // Get repo closed issues from time period
        const { data: issues } = await octokit.request(
            'GET /repos/{owner}/{repo}/issues?state={issue_state}&since={updated_since}',
            {
                owner: REPOSITORY_OWNER,
                repo: repository,
                issue_state: 'closed',
                updated_since: timePeriodStartDate.toISOString(),
            },
        );

        // Build up the user data for each repository
        for (const user of contributors) {
            const userEntry = {
                id: user.login,
            };

            // Get user's contributions to repo from the last X number of weeks
            const userContributions = mergeContributions(contributions, user, NUMBER_OF_WEEKS);

            for (const [key, value] of Object.entries(userContributions)) {
                switch (key) {
                    case 'a': userEntry.additions = value;
                    case 'd': userEntry.deletions = value;
                    case 'c': userEntry.commits = value;
                }
            }

            // Get user PRs - created
            const pullsCreatedByUser = pullsCreatedWithinTimePeriod.filter((pull) => pull.user.login === user.login);
            userEntry.pullsCreated = pullsCreatedByUser.length;

            // Get user PRs - reviewed
            userEntry.pullReviews = getUserPullReviews(pullReviews, user.login);

            // Get user issues closed
            const issuesClosedByUser = issues.filter((issue) => {
                if (issue.assignee && issue.assignee.login === user.login) {
                    return issue;
                }
            });
            userEntry.issuesClosed = issuesClosedByUser.length;

            // Store the user's entry if not empty
            if (hasContributions(userEntry)) {
                repoStats.push(userEntry);
                console.log(`Adding ${user.login}'s contributions \n`);
            }
        }

        // stats.push(repoStats);
        await store.setValue(repository, repoStats)
    }

    console.log('Done!');
});
