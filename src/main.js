const Apify = require('apify');
const { Octokit } = require('@octokit/rest');
require('dotenv').config();

const {
    mergeContributions,
    filterPullsByTimePeriod,
    getContributorPullReviews,
    hasContributions } = require('./helpers.js')

const { utils: { log } } = Apify;

const octokit = new Octokit({
    auth: process.env.GITHUB_API_TOKEN,
    state: 'all',
    userAgent: 'GitHub Champion v0.0.1',
})

Apify.main(async () => {
    const { REPOSITORIES, REPOSITORY_OWNER, NUMBER_OF_WEEKS } = await Apify.getInput();
    const stats = [];

    const todaysDate = new Date();
    const numberOfDays = NUMBER_OF_WEEKS * 7;
    const timePeriodStartDate = new Date(
        todaysDate.getFullYear(),
        todaysDate.getMonth(),
        (todaysDate.getDate() - numberOfDays)
    );

    for (const repository of REPOSITORIES) {
        const repoStats = {
            [repository]: {},
        };

        // Get repo contributors
        const { data: contributors } = await octokit.repos.listContributors({
            owner: REPOSITORY_OWNER,
            repo: repository,
        });

        // Get repo contributions
        const { data: contributions } = await octokit.request(
            'GET /repos/{owner}/{repo}/stats/contributors',
            {
                owner: REPOSITORY_OWNER,
                repo: repository,
            }
        );
        console.log(`Getting "${repository}" contributions`);

        // Get repo pull requests
        const { data: pulls } = await octokit.pulls.list({
            owner: REPOSITORY_OWNER,
            repo: repository,
            state: 'all'
        });

        const pullsCreatedWithinTimePeriod = await filterPullsByTimePeriod(pulls, timePeriodStartDate);
        console.log(`Getting "${repository}" pull requests`);

        // Get reviews for each pull
        const pullReviews = [];
        for (const pull of pullsCreatedWithinTimePeriod) {
            const { data: reviews } = await octokit.request(
                'GET /repos/{owner}/{repo}/pulls/{pull_number}/reviews',
                {
                    owner: REPOSITORY_OWNER,
                    repo: repository,
                    pull_number: pull.number,
                }
            );
            pullReviews.push({
                [pull.number]: reviews,
            });
        };

        // Get repo closed issues from time period
        const { data: issues } = await octokit.request(
            'GET /repos/{owner}/{repo}/issues?state={issue_state}&since={updated_since}',
            {
                owner: REPOSITORY_OWNER,
                repo: repository,
                issue_state: 'closed',
                updated_since: timePeriodStartDate.toISOString(),
            }
        )


        // Build up the contributor data for each repository
        for (const contributor of contributors) {
            let contributorEntry = repoStats[repository][contributor.login];
            contributorEntry = {};

            console.log(`Analyzing ${contributor.login}'s contributions`);

            // Get user's contributions to repo from the last X number of weeks
            contributions.map((item) => {
                if (item.author.login === contributor.login) {
                    const contributionsArray = item.weeks.slice(Math.max(item.weeks.length - NUMBER_OF_WEEKS, 0));
                    return contributorEntry.contributions = mergeContributions(contributionsArray);
                };
            });

            // Get contributor PRs - created
            const pullsCreatedByContributor = pullsCreatedWithinTimePeriod.filter((pull) => {
                return pull.user.login === contributor.login;
            });
            contributorEntry.pullsCreated = pullsCreatedByContributor.length;

            // Get contributor PRs - reviewed
            contributorEntry.pullReviews = getContributorPullReviews(pullReviews, contributor.login);

            // Get contributor issues closed
            const issuesClosedByContributor = issues.filter((issue) => {
                if (issue.assignee && issue.assignee.login === contributor.login) {
                    return issue;
                };
            });
            contributorEntry.issuesClosed = issuesClosedByContributor.length;

            // Store the contributor's entry if not empty
            if (hasContributions(contributorEntry)) {
                repoStats[repository][contributor.login] = contributorEntry
            } else {
                console.log('Inactive');
            };
        };

        stats.push(repoStats);
    }
    await Apify.pushData({
        stats,
    });

});
