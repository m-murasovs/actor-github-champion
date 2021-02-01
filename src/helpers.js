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