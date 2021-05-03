const calculateMarginRequirement1Legs = (trade, underlying, strike, premium, contracts) => {
  const contractsMultiplier = contracts * 100;

  // https://support.tastyworks.com/support/solutions/articles/43000435177-naked-short-put?_sp=31c1bbdd-02e4-4bd3-b7f6-35c2037e644b.1620028919678
  // https://support.tastyworks.com/support/solutions/articles/43000435195-naked-short-call?_sp=31c1bbdd-02e4-4bd3-b7f6-35c2037e644b.1620028921932
  if (trade == "Naked Put" || trade == "Naked Call") {
    const OMT = underlying - strike;
    let firstReq;
    if (trade == "Naked Call") {
      firstReq = (0.2 * underlying + OMT + premium) * contractsMultiplier;
    } else {
      firstReq = (0.2 * underlying - OMT + premium) * contractsMultiplier;
    }

    const subStrike = 0.1 * strike;
    const secondReq = (subStrike + premium) * contractsMultiplier;

    const thirdReq = 2.5 * contractsMultiplier;

    const winner = Math.max(firstReq, secondReq, thirdReq);
    const premiumMultiplied = premium * contractsMultiplier;
    const res = winner - premiumMultiplied;
    return res;
  }

  // https://support.tastyworks.com/support/solutions/articles/43000435285-cash-secured-put?_sp=31c1bbdd-02e4-4bd3-b7f6-35c2037e644b.1620028920811
  if (trade == "Cash Secured Put") {
    const cashSecuredAmount = strike * contractsMultiplier;
    const premiumMultiplied = premium * contractsMultiplier;

    // Buying Power Requirement
    const BP = cashSecuredAmount - premiumMultiplied;
    return BP;
  }

  // https://support.tastyworks.com/support/solutions/articles/43000435373-long-put?_sp=31c1bbdd-02e4-4bd3-b7f6-35c2037e644b.1620028921419
  // https://support.tastyworks.com/support/solutions/articles/43000435368-long-call?_sp=31c1bbdd-02e4-4bd3-b7f6-35c2037e644b.1620028922763
  if (trade == "Long Put" || "Long Call") {
    const res = premium * contractsMultiplier;
    return res;
  }
};

const calculateMarginRequirement2Legs = (trade, longStrike, shortStrike, longStrikePremium, shortStrikePremium, contracts) => {
  const contractsMultiplier = contracts * 100;
  const net = ((longStrikePremium - shortStrikePremium) * contractsMultiplier).toFixed(0);

  // https://support.tastyworks.com/support/solutions/articles/43000435253-long-debit-vertical-spread?_sp=31c1bbdd-02e4-4bd3-b7f6-35c2037e644b.1620028931401
  if (trade == "Debit Spread") {
    return net;
  } else {
    // https://support.tastyworks.com/support/solutions/articles/43000435260-short-credit-vertical-spread?_sp=31c1bbdd-02e4-4bd3-b7f6-35c2037e644b.1620028930752

    // Margin Requirement
    const marginReq = (shortStrike - longStrike) * contractsMultiplier;
    // Buying Power Effect
    const BP = marginReq - parseInt(net);
    return BP;
  }
};

const calculateMarginRequirement4Legs = (
  trade,
  longPutStrike,
  shortPutStrike,
  longCallStrike,
  shortCallStrike,
  longPutStrikePremium,
  shortPutStrikePremium,
  longCallStrikePremium,
  shortCallStrikePremium,
  contracts
) => {
  const contractsMultiplier = contracts * 100;

  // https://support.tastyworks.com/support/solutions/articles/43000435229-short-iron-condor?_sp=31c1bbdd-02e4-4bd3-b7f6-35c2037e644b.1620028928760
  if (trade == "Short Iron Condor") {
    // Call Side Spread
    const callSpread = Math.abs(longCallStrike - shortCallStrike);
    // Put Side Spread
    const putSpread = Math.abs(longPutStrike - shortPutStrike);

    // Net Credit
    const net =
      (longPutStrikePremium + shortPutStrikePremium + longCallStrikePremium + shortCallStrikePremium) * contractsMultiplier;

    if (callSpread !== putSpread) {
      const winner = Math.max(callSpread, putSpread);
      return winner * contractsMultiplier;
    }
    return putSpread * contractsMultiplier;
  }

  // https://support.tastyworks.com/support/solutions/articles/43000435241-long-iron-condor?_sp=31c1bbdd-02e4-4bd3-b7f6-35c2037e644b.1620028929487
  if (trade == "Long Iron Condor") {
    // Call Side
    const call = Math.abs(longCallStrikePremium - shortCallStrikePremium);
    // Put Side
    const put = Math.abs(longPutStrikePremium - shortPutStrikePremium);

    const diff = call + put;
    const res = diff * contractsMultiplier;
    return res;
  }
};

// Tests
const test = (res, correct) => {
  if (parseInt(res) === correct) return true;
  else return false;
};

// 1 Leg Tests
console.log("Test Result for Naked Put: " + test(calculateMarginRequirement1Legs("Naked Put", 47.5, 45, 0.5, 1), 700));
console.log("Test Result for Naked Call: " + test(calculateMarginRequirement1Legs("Naked Call", 65, 68, 1.5, 1), 1000));
console.log(
  "Test Result for Cash Secured Put: " + test(calculateMarginRequirement1Legs("Cash Secured Put", 12, 11, 0.75, 6), 6150)
);
console.log("Test Result for Long Call: " + test(calculateMarginRequirement1Legs("Long Put", 30, 25, 3.58, 7), 2506));
console.log("Test Result for Long Call: " + test(calculateMarginRequirement1Legs("Long Call", 40, 45, 1.56, 3), 468));

// 2 Leg Tests
console.log(
  "Test Result for Credit Spread: " + test(calculateMarginRequirement2Legs("Credit Spread", 101, 100, 1.05, 1.4, 1), -65)
);
console.log(
  "Test Result for Debit Spread: " + test(calculateMarginRequirement2Legs("Debit Spread", 101, 100, 1.05, 1.4, 1), -35)
);

// 4 Leg Tests
console.log(
  "Test Result for Short Iron Condor: " +
    test(calculateMarginRequirement4Legs("Short Iron Condor", 50, 53, 70, 67, -0.8, 1.25, -0.75, 2, 2), 600)
);
console.log(
  "Test Result for Long Iron Condor: " +
    test(calculateMarginRequirement4Legs("Long Iron Condor", 50, 40, 60, 70, 6, 2.5, 6, 1.5, 6), 4800)
);
