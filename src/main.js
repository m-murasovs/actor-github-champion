const Apify = require('apify');
const { Octokit } = require('@octokit/rest');
require('dotenv').config();

const { mergeContributions } = require('./helpers.js')

const { utils: { log } } = Apify;

const octokit = new Octokit({
    auth: process.env.GITHUB_API_TOKEN,
    state: 'all',
    userAgent: 'GitHub Champion v0.0.1',
})

Apify.main(async () => {
    const { REPOSITORIES, REPOSITORY_OWNER, NUMBER_OF_WEEKS } = await Apify.getInput();
    const stats = [];

    for (const repository of REPOSITORIES) {
        repoStats = {
            [repository]: {},
        };
        // Get repo contributors
        const { data: contributors } = await octokit.repos.listContributors({
            owner: REPOSITORY_OWNER,
            repo: repository,
        });
        // Get all contributions for repo
        const { data: contributions } = await octokit.request(
            'GET /repos/{owner}/{repo}/stats/contributors',
            {
                owner: REPOSITORY_OWNER,
                repo: repository,
            }
        );
        console.log(`Getting "${repository}" contributions`);

        // Build up the contributor data for each repository
        for (const contributor of contributors) {
            repoStats[repository][contributor.login] = {};

            // Convert timestamp to date: console.log(new Date(1605398400 * 1000).toDateString())
            // Get user's contributions to repo from the last X number of weeks
            contributions.map((item) => {
                if (item.author.login === contributor.login) {
                    const contributionsArray = item.weeks.slice(Math.max(item.weeks.length - NUMBER_OF_WEEKS, 0));
                    return repoStats[repository][contributor.login].contributions = mergeContributions(contributionsArray);
                };
            });

        }



        const { data: milestones } = await octokit.issues.listMilestones({
            owner: REPOSITORY_OWNER,
            repo: repository,
            state: 'all'
        });
        // We can calculate the champion by milestone, since every milestone comes with its own created/does on times, which we can match to the contribution weeks
        // Ah, but not everyone will want to track it by milestone - maybe we can just go by week/date

        // const { data: pulls } = await octokit.pulls.list({
        //     owner: REPOSITORY_OWNER,
        //     repo: repository,
        //     state: 'all'
        // });

        // console.log(pulls)


        // issues
        // const { data: issues } = await octokit.request(
        //     'GET /repos/{owner}/{repo}/issues?creator={contributor}',
        //     {
        //         owner: REPOSITORY_OWNER,
        //         repo: repository,
        //         creator: contributor
        //     }
        // )


        stats.push(repoStats);
    }

    await Apify.pushData({
        stats,
    });

});
