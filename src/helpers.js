exports.getAllRepoNames = (allOrgRepos) => {
    const names = []
    allOrgRepos.map((repo) => names.push(repo.name));

    console.log('Getting the owner\'s repositories');

    return names;
}

exports.mergeContributions = (contributions, user, numberOfWeeks) => {
    const result = {};

    contributions.map((item) => {
        if (item.author.login === user.login) {
            const contributionsArray = item.weeks.slice(Math.max(item.weeks.length - numberOfWeeks, 0));

            contributionsArray.map((contr) => {
                for (let [key, value] of Object.entries(contr)) {
                    // Exclude the 'week' key from the contributions object
                    if (result[key] && key !== 'w') {
                        result[key] += value;
                    } else if (!result[key] && key !== 'w') {
                        result[key] = value;
                    }
                }
            });
        }
    });
    return result;
};

exports.filterPulls = (pulls, timePeriodStartDate, includeReleases) => pulls.filter((pull) => {
    const pullIsFromTimePeriod = new Date(pull.created_at) > timePeriodStartDate;
    const pullIsNotRelease = pull.base.ref !== 'master';

    const shouldPullBeCounted = includeReleases ? pullIsFromTimePeriod : pullIsFromTimePeriod && pullIsNotRelease;

    return shouldPullBeCounted;
});

exports.getUserPullReviews = (pullReviews, userLogin) => {
    let count = 0;
    for (const pull of pullReviews) {
        Object.values(pull).map((reviewArray) => {
            if (reviewArray.length) {
                reviewArray.map((review) => {
                    if (review.user.login === userLogin) {
                        count += 1;
                    }
                });
            }
        });
    }
    return count;
};

exports.hasContributions = (userEntry) => {
    const hasCommits = userEntry.contributions && userEntry.contributions.c;
    const hasOtherActivity = userEntry.pullReviews || userEntry.pullsCreated || userEntry.issuesClosed;

    return hasCommits || hasOtherActivity;
};

exports.getTopContributors = (repoStats) => {
    const topContributors = [];
    if (repoStats.length) {
        repoStats.map(({ id, pullReviews, issuesClosed, pullsCreated }) => {
            // Pull reviews and closed issues count for 1 point, created pull requests count for half a point
            const pullsCreatedScore = pullsCreated * 0.5;

            topContributors.push({
                name: id,
                total: (pullReviews + issuesClosed + pullsCreatedScore),
                pullReviews,
                issuesClosed,
                pullsCreated
            });
        });
    }

    topContributors.sort((a, b) => b.total - a.total);

    return topContributors.slice(0, 3);
}
