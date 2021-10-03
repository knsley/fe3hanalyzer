/*
Copyright 2021 knsley
(https://github.com/knsley)

This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

import { ProbabilityArray } from "../../src/sim/ProbabilityArray";
import { SegmentedDistribution } from "../../src/sim/SegmentedDistribution";

test("SegmentedDistribution reflects the ProbabilityArray it was based on.", () => {
    const p = new ProbabilityArray(0, 10);
    p.setProbability(1, 0.1);
    p.setProbability(2, 0.2);
    p.setProbability(4, 0.3);
    p.setProbability(6, 0.4);

    const distribution = new SegmentedDistribution(p);
    const cumulative = distribution.getCumulativeProbabilities();
    expect(cumulative.length).toBe(11);
    expect(cumulative[0][1]).toBeCloseTo(0.0, 4);
    expect(cumulative[1][1]).toBeCloseTo(0.1, 4);
    expect(cumulative[2][1]).toBeCloseTo(0.3, 4);
    expect(cumulative[3][1]).toBeCloseTo(0.3, 4);
    expect(cumulative[4][1]).toBeCloseTo(0.6, 4);
    expect(cumulative[5][1]).toBeCloseTo(0.6, 4);
    expect(cumulative[6][1]).toBeCloseTo(1.0, 4);
    expect(cumulative[7][1]).toBeCloseTo(1.0, 4);
});

test("sample() returns correct results according to intervals from the ProbabilityArray it was based on.", () => {
    const p = new ProbabilityArray(0, 10);
    p.setProbability(1, 0.1);
    p.setProbability(2, 0.2);
    p.setProbability(4, 0.3);
    p.setProbability(6, 0.4);
    const d = new SegmentedDistribution(p);

    expect(d.sample(0.0)).toBe(1);
    // 3 has width of 0 so the algorithm should select the 4th interval
    expect(d.sample(0.35)).toBe(4);
    expect(d.sample(0.8)).toBe(6);
    expect(d.sample(1.0)).toBe(6);
});