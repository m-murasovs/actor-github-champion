exports.mergeContributions = (data) => {
    const result = {};

    data.forEach((item) => {
        for (let [key, value] of Object.entries(item)) {
            // Exclude the 'week' key from the contributions object
            if (result[key] && key !== 'w') {
                result[key] += value;
            } else if (!result[key] && key !== 'w') {
                result[key] = value;
            }
        }
    });

    return result;
}

exports.filterPullsByTimePeriod = (pulls, timePeriodStartDate) => {
    return pulls.filter(pull => {
        const pullCreationDate = new Date(pull.created_at);
        return pullCreationDate > timePeriodStartDate;
    });
}

exports.getContributorPullReviews = (pullReviews, contributorLogin) => {
    let count = 0;
    for (const pull of pullReviews) {
        Object.values(pull).map((reviewArray) => {
            if (reviewArray.length) {
                reviewArray.map(review => {
                    if (review.user.login === contributorLogin) {
                        count += 1;
                    }
                })
            }
        });
    }
    return count;
};

exports.hasContributions = (contributorEntry) => {
    const hasCommits = contributorEntry.contributions && contributorEntry.contributions.c;
    const hasOtherActivity = contributorEntry.pullReviews || contributorEntry.pullsCreated || contributorEntry.issuesClosed;

    return hasCommits || hasOtherActivity;
}