// fakeData.ts

// --------------------
// ENVIRONMENT CONFIGS
// --------------------

export const prodConfig = {
    service: {
        name: "payment-service",
        version: "1.4.2"
    },
    transaction: {
        timeout: 5000,
        retries: 3
    },
    featureFlags: {
        enableNewUI: true,
        enableDiscounts: false
    },
    commit: "prod-abc123"
};

export const devConfig = {
    service: {
        name: "payment-service",
        version: "1.4.2"
    },
    transaction: {
        timeout: "5000", 
    },
    featureFlags: {
        enableNewUI: true,
        enableBetaTesting: true
    },
    commit: "dev-xyz888"
};

export const qaConfig = {
    service: {
        name: "payment-service",
        version: "1.4.1"
    },
    featureFlags: {
        enableNewUI: false,
        enableDiscounts: false
    },
    commit: "qa-55fa22"
};

// --------------------
// BRANCH CONFIGS
// --------------------

export const mainProdConfig = {
    transaction: {
        timeout: 5000,
        retries: 3,
        maxAmount: 100000
    }
};

export const featureBranchProdConfig = {
    transaction: {
        timeout: 5000,
        retries: 3
    }
};
