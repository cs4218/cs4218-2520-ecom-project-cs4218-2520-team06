// Gallen Ong, A0252614L
// Pattern: ramp to level -> hold -> ramp to next level -> hold

function buildRampHoldStages({
  baseLoad,
  multipliers,
  rampDuration,
  holdDuration,
  recoverDuration,
  postRecoveryObservationDuration,
  postRecoveryMultiplier,
}) {
  const stages = [];

  for (const multiplier of multipliers) {
    const target = baseLoad * multiplier;
    stages.push({ duration: rampDuration, target });
    stages.push({ duration: holdDuration, target });
  }

  stages.push({ duration: recoverDuration, target: 0 });
  stages.push({
    duration: postRecoveryObservationDuration,
    target: baseLoad * postRecoveryMultiplier,
  });
  return stages;
}

export const stressPatternConfig = {
  // Shared staged stress configuration for all flows.
  baselineUsers: 150,
  multipliers: [1, 2, 4, 5, 6],
  rampDuration: '1m',
  holdDuration: '2m',
  recoverDuration: '2m',
  postRecoveryObservationDuration: '2m',
  postRecoveryMultiplier: 1,
};

export const loadProfile = {
  // Main staged stress pattern for customer flows.
  rampSustainRecover: buildRampHoldStages({
    baseLoad: stressPatternConfig.baselineUsers,
    multipliers: stressPatternConfig.multipliers,
    rampDuration: stressPatternConfig.rampDuration,
    holdDuration: stressPatternConfig.holdDuration,
    recoverDuration: stressPatternConfig.recoverDuration,
    postRecoveryObservationDuration:
      stressPatternConfig.postRecoveryObservationDuration,
    postRecoveryMultiplier: stressPatternConfig.postRecoveryMultiplier,
  }),

  // Admin flows use the same stress stages/load as user flows.
  adminStress: buildRampHoldStages({
    baseLoad: stressPatternConfig.baselineUsers,
    multipliers: stressPatternConfig.multipliers,
    rampDuration: stressPatternConfig.rampDuration,
    holdDuration: stressPatternConfig.holdDuration,
    recoverDuration: stressPatternConfig.recoverDuration,
    postRecoveryObservationDuration:
      stressPatternConfig.postRecoveryObservationDuration,
    postRecoveryMultiplier: stressPatternConfig.postRecoveryMultiplier,
  }),

  // Admin orders flow uses the same stress stages/load as user flows.
  adminOrdersStress: buildRampHoldStages({
    baseLoad: stressPatternConfig.baselineUsers,
    multipliers: stressPatternConfig.multipliers,
    rampDuration: stressPatternConfig.rampDuration,
    holdDuration: stressPatternConfig.holdDuration,
    recoverDuration: stressPatternConfig.recoverDuration,
    postRecoveryObservationDuration:
      stressPatternConfig.postRecoveryObservationDuration,
    postRecoveryMultiplier: stressPatternConfig.postRecoveryMultiplier,
  }),
};
