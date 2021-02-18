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

exports.filterPulls = (pulls, timePeriodStartDate) => pulls.filter((pull) => {
    console.log(pull.number, pull.created_at)
    const pullIsFromTimePeriod = new Date(pull.created_at) > timePeriodStartDate;
    const pullIsRelease = pull.title.toLowerCase().includes('release') && pull.base.ref === 'master';

    if (pullIsFromTimePeriod && !pullIsRelease) {
        return pull;
    }
});

exports.getUserPullReviews = (pullReviews, userLogin) => {
    let count = 0;
    for (const pull of pullReviews) {
        Object.values(pull).map((reviewArray) => {
            if (reviewArray.length) {
                reviewArray.map((review) => {
                    if (
                        review.user.login === userLogin
                        && (review.state === 'APPROVED' || review.state === 'CHANGES_REQUESTED')
                    ) {
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

exports.getTopContributorsInOrg = (allContributions) => {
    const allContributorInfoInAllRepos = [];

    allContributions.map(organization => {
        organization.map(contributor => {
            allContributorInfoInAllRepos.push(contributor);
        })
    })

    mergedRepoStats = {};
    allContributorInfoInAllRepos.map(contributor => {
        if (mergedRepoStats[contributor.id]) {
            for (let [key, value] of Object.entries(contributor)) {
                if (mergedRepoStats[contributor.id][key] && key !== 'id') {
                    mergedRepoStats[contributor.id][key] += value;
                } else if (!mergedRepoStats[contributor.id][key]) {
                    mergedRepoStats[contributor.id][key] = value;
                }
            }
        } else if (!mergedRepoStats[contributor.id]) {
            mergedRepoStats[contributor.id] = contributor;
        }
    })

    const mergedContributorStats = [];
    for (const value of Object.values(mergedRepoStats)) {
        mergedContributorStats.push(value);
    }

    const topContributors = this.getTopContributors(mergedContributorStats);

    topContributors.sort((a, b) => b.total - a.total);

    return { 'Organization All-stars': topContributors.slice(0, 3) };
}

exports.filterIssuesClosedByUser = (issues, user) => {
    let count = 0;

    const assigneesIncludesUser = (issue, user) => {
        if (issue.assignees.some(assignee => assignee.login === user.login)) {
            return true;
        }
    };

    issues.filter((issue) => {
        if (
            issue.assignee
            && !issue.pull_request
            && (issue.assignee.login === user.login)
        ) {
            count++;
        } else if (
            issue.assignees
            && !issue.pull_request
            && assigneesIncludesUser(issue, user)
        ) {
            count++
        };
    });

    return count;
}
