exports.mergeContributions = (contributions, user, numberOfWeeks) => {
    const result = {};

    contributions.map((item) => {
        if (item.author.login === user.login) {
            const contributionsArray = item.weeks.slice(Math.max(item.weeks.length - numberOfWeeks, 0));

            contributionsArray.map((item) => {
                for (let [key, value] of Object.entries(item)) {
                    // Exclude the 'week' key from the contributions object
                    if (result[key] && key !== 'w') {
                        result[key] += value;
                    } else if (!result[key] && key !== 'w') {
                        result[key] = value;
                    }
                }
            });
        };
    });

    return result;
}

exports.filterPullsByTimePeriod = (pulls, timePeriodStartDate) => {
    return pulls.filter(pull => {
        const pullCreationDate = new Date(pull.created_at);
        return pullCreationDate > timePeriodStartDate;
    });
}

exports.getUserPullReviews = (pullReviews, userLogin) => {
    let count = 0;
    for (const pull of pullReviews) {
        Object.values(pull).map((reviewArray) => {
            if (reviewArray.length) {
                reviewArray.map(review => {
                    if (review.user.login === userLogin) {
                        count += 1;
                    }
                })
            }
        });
    }
    return count;
};

exports.hasContributions = (userEntry) => {
    const hasCommits = userEntry.contributions && userEntry.contributions.c;
    const hasOtherActivity = userEntry.pullReviews || userEntry.pullsCreated || userEntry.issuesClosed;

    return hasCommits || hasOtherActivity;
}