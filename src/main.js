const Apify = require('apify');
const { Octokit } = require('@octokit/rest');
require('dotenv').config();

const {
    mergeContributions,
    filterPulls,
    getUserPullReviews,
    hasContributions,
    getAllRepoNames,
    getTopContributors,
    getTopContributorsInOrg,
    filterIssuesClosedByUser
} = require('./helpers.js');


Apify.main(async () => {
    const { repositories, repositoryOwner, numberOfWeeks, githubApiToken } = await Apify.getInput();
    const topContributorsInRepo = [];
    const allContributorsInfoInOrg = [];

    const octokit = new Octokit({
        auth: githubApiToken,
        state: 'all',
        userAgent: 'GitHub Champion v0.0.1',
    });

    const detailedMetrics = await Apify.openKeyValueStore('detailed-repo-metrics');
    const topThrees = await Apify.openKeyValueStore('top-threes');

    const todaysDate = new Date();
    const numberOfDays = numberOfWeeks * 7;
    const timePeriodStartDate = new Date(
        todaysDate.getFullYear(),
        todaysDate.getMonth(),
        (todaysDate.getDate() - numberOfDays),
    );

    // If repositories is empty, iterate through all of the owner's repos
    let allRepos = '';
    if (!repositories) {
        allRepos = await octokit.teams.listReposInOrg({
            org: repositoryOwner,
            team_slug: 'platform-team',
        });
    }
    const allRepoNames = repositories || getAllRepoNames(allRepos.data);

    for (const repository of allRepoNames) {
        const repoStats = [];

        console.log(`--- Getting stats for | ${repository} |\n`);

        // Get repo contributors
        const { data: contributors } = await octokit.repos.listContributors({
            owner: repositoryOwner,
            repo: repository,
        });

        // Get repo contributions
        const { data: contributions } = await octokit.repos.getContributorsStats({
            owner: repositoryOwner,
            repo: repository,
        });

        // Get repo pull requests
        const { data: pulls } = await octokit.pulls.list({
            owner: repositoryOwner,
            repo: repository,
            state: 'all',
        });

        const filteredPulls = await filterPulls(pulls, timePeriodStartDate);

        // Get reviews for each pull
        const pullReviews = [];
        for (const pull of filteredPulls) {
            const { data: reviews } = await octokit.request(
                'GET /repos/{owner}/{repo}/pulls/{pull_number}/reviews',
                {
                    owner: repositoryOwner,
                    repo: repository,
                    pull_number: pull.number,
                },
            );
            pullReviews.push({
                [pull.number]: reviews,
            });

            await Apify.utils.sleep(100);
        }

        await Apify.utils.sleep(100);

        // Get repo closed issues from time period
        const getIssues = async (pageNumber) => {
            const issues = await octokit.request(
                'GET /repos/{owner}/{repo}/issues?state={issue_state}&per_page={per_page}&page={page}&since={closed_since}',
                {
                    owner: repositoryOwner,
                    repo: repository,
                    issue_state: 'closed',
                    page: pageNumber,
                    per_page: 100,
                    closed_since: timePeriodStartDate.toISOString(),
                },
            );
            return issues;
        }
        // Get the first 4 pages
        const { data: issuesPageOne } = await getIssues(1);
        const { data: issuesPageTwo } = await getIssues(2);
        const { data: issuesPageThree } = await getIssues(3);
        const { data: issuesPageFour } = await getIssues(4);
        const issues = issuesPageOne.concat(issuesPageTwo, issuesPageThree, issuesPageFour);

        // Build up the user data for each repository
        for (const user of contributors) {
            const userEntry = {
                id: user.login,
            };

            // Get user's contributions to repo from the last X number of weeks
            const userContributions = mergeContributions(contributions, user, numberOfWeeks);

            for (const [key, value] of Object.entries(userContributions)) {
                switch (key) {
                    case 'a': userEntry.additions = value;
                    case 'd': userEntry.deletions = value;
                    case 'c': userEntry.commits = value;
                }
            }

            // Get user PRs - created
            const pullsCreatedByUser = filteredPulls.filter((pull) => pull.user.login === user.login);
            userEntry.pullsCreated = pullsCreatedByUser.length;

            // Get user PRs - reviewed
            userEntry.pullReviews = getUserPullReviews(pullReviews, user.login);

            // Get user issues closed
            userEntry.issuesClosed = filterIssuesClosedByUser(Object.values(issues), user);

            // Store the user's entry if not empty
            if (hasContributions(userEntry)) {
                repoStats.push(userEntry);
                console.log(`Adding ${user.login}'s contributions \n`);
            }
        }

        // Push the stats for organization-wide analysis
        allContributorsInfoInOrg.push(repoStats);
        // Store detailed metrics for each repo
        await detailedMetrics.setValue(repository, repoStats);
        // Get top 3 contributors in each repo
        const mergedKeyStats = getTopContributors(repoStats);
        topContributorsInRepo.push({
            [repository]: mergedKeyStats
        });
        // Sleep to avoid pushing rate limits
        await Apify.utils.sleep(100);
    }

    const topContributorsInOrg = getTopContributorsInOrg(allContributorsInfoInOrg);

    await topThrees.setValue('top-contributors-repos', topContributorsInRepo);
    await topThrees.setValue('top-contributors-org', topContributorsInOrg);
    // Add also to the default dataset so users can check results right away
    await Apify.pushData(topContributorsInRepo);
    await Apify.pushData(topContributorsInOrg);

    console.log('Done!');
});
