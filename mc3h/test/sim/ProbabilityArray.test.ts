/*
Copyright 2021 knsley
(https://github.com/knsley)

This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

import { ProbabilityArray } from '../../src/sim/ProbabilityArray';

test("Initializing with same minValue and maxValue should create object with width 1", () => {
    const p = new ProbabilityArray(5, 5);
    expect(p.width).toBe(1);
    expect(p.minValue).toBe(5);
    expect(p.maxValue).toBe(5);
});

test("Initializing with width > 1 should create object with expected width.", () => {
    const p = new ProbabilityArray(5, 10);
    // 6 items wide, 5 to 10 inclusive
    expect(p.width).toBe(6);
});

test("Initializing with maxValue less than minValue should cause error.", () => {
    expect(() => new ProbabilityArray(2,1)).toThrowError();
});

test("get and set probability should correlate on affected bucket and probability.", () => {
    const p = new ProbabilityArray(0, 10);
    p.setProbability(5, 0.5);
    expect(p.getProbability(5)).toBe(0.5);
});

test("clone() should create identical object.", () => {
    const p = new ProbabilityArray(0, 10);
    p.setProbability(1, 0.1);
    p.setProbability(2, 0.2);
    p.setProbability(4, 0.3);
    p.setProbability(6, 0.4);

    const c = p.clone();

    for (let i = 0; i <= 10; i++)
    {
        expect(c.getProbability(i)).toBe(p.getProbability(i));
    }
});

test("addProbability() should modify the correct bucket by the correct amount.", () => {
    const p = new ProbabilityArray(0, 10);
    p.setProbability(5, 0.1);
    p.addProbability(5, 0.5);
    expect(p.getProbability(5)).toBe(0.6);
});

test("normalize() should result in probability sum near 1.0", () => {
    const p = new ProbabilityArray(0, 10);
    p.setProbability(1, 0.249);
    p.setProbability(2, 0.249);
    p.setProbability(4, 0.249);
    p.setProbability(6, 0.249);
    p.normalize();

    let sum = 0;
    for (let i = 0; i <= 10; i++)
    {
        sum += p.getProbability(i);
    }

    expect(sum).toBeCloseTo(1.0, 4);
});

test("clampProbability() should result in correct minValue and maxValue range.", () => {
    const p = new ProbabilityArray(0, 10);
    const clamped = p.clampProbability(5);
    expect(clamped.minValue).toBe(5);
    expect(clamped.maxValue).toBe(10);
});

test("clampProbability() should result in correctly summed bucket for lowerBound.", () => {
    const p = new ProbabilityArray(0, 10);
    p.setProbability(1, 0.1);
    p.setProbability(2, 0.2);
    p.setProbability(4, 0.3);
    p.setProbability(6, 0.4);
    const clamped = p.clampProbability(5);

    expect(clamped.getProbability(5)).toBeCloseTo(0.6, 4);
});

test("clampProbability() should clone buckets above lowerBound", () => {
    const p = new ProbabilityArray(0, 10);
    p.setProbability(1, 0.1);
    p.setProbability(2, 0.2);
    p.setProbability(4, 0.3);
    p.setProbability(6, 0.4);
    const clamped = p.clampProbability(5);
    
    for (let i = 6; i <= 10; i++)
    {
        expect(clamped.getProbability(i)).toBe(p.getProbability(i));
    }
});

test("stepProbability() should correctly calculate next step", () => {
    const p = new ProbabilityArray(0, 2);
    p.setProbability(0, 0.25);
    p.setProbability(1, 0.5);
    p.setProbability(2, 0.25);

    const next = p.stepProbability(0.8, 1000);
    expect(next.minValue).toBe(0);
    expect(next.maxValue).toBe(3);
    expect(next.getProbability(0)).toBeCloseTo(0.2 * 0.25);
    expect(next.getProbability(1)).toBeCloseTo(0.8 * 0.25 + 0.2 * 0.5);
    expect(next.getProbability(2)).toBeCloseTo(0.8 * 0.5 + 0.2 * 0.25);
    expect(next.getProbability(3)).toBeCloseTo(0.8 * 0.25);
});