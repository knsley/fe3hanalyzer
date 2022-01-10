# The Nitty Gritty Statistics and Probability Stuff

This document compiles the research that went into making the growth calculator.

## Levelup Mechanics

The basic idea is that each stat has a percentage chance of increasing. However, Three Houses (like many other Fire Emblem games) has some hidden mechanics.

These mechanics make projecting stat growths more complicated. If every levelup was a straight up RNG roll, the range of outcomes would look like normal curves (to be precise, binomial distributions) and you could calculate the general shape of the outcomes from a simple median and standard deviation. But that's not really the case.

In practice it gets a lot more complicated in tiny ways. And that's fun for theorycrafting and stat manipulation, and it makes writing an accurate calculator a fun challenge.

### Growth Rates

The most basic formula for a character's growth rate in a specific stat is:<br>
`[growth rate] = [character's growth rate] + [class's growth rate]`

There are several exceptions to this rule:

* For student characters (affiliated with the three houses or the DLC house) plus Byleth and Anna, there is a ["RNG protection" mechanism](https://www.reddit.com/r/FireEmblemThreeHouses/comments/m1hqoi/i_just_got_0_growths_on_a_level_up/) where if a character rolls 0 or 1 total stat gains, they get a hardcoded [+1 to STR and MAG](https://gamefaqs.gamespot.com/switch/204445-fire-emblem-three-houses/answers/550524-is-it-possible-to-increase-no-stat-after-a-level-up).

* If a character hits their max stats, even if they roll well on RNG the stat will not increase above the max. Remodeling the statues can raise the caps by +5, but they won't remove the cap entirely.

* If the growth rate is below 0%, it's handled as a flat 0%. If the growth rate is above 100%, it's handled as a flat 100%. In Three Houses there is no mechanism for gaining more than one point in a levelup.

### Base/Bonus Stats

The player's stats that you see in the game are calculated as:<br>
`[displayed stat] = [character base stat] + [class bonus stat] + [other effects]`

Other effects are things like battalions, abilities, ability effects, item bonuses, and possibly some other things I'm forgetting right now. 

The most interesting numbers here are the character's base stats and the class's bonus stats, because:

1. When a character levels up, the base stat is what changes.
2. The class bonus stats can cause a character's stats to fluctuate depending on which class they change to. 

#### Class Base Stats

"Class Base Stats", as opposed to "*Character* Base Stats", or "Class *Bonus Stats*".

When a character changes classes, each of the *character's* base stats are compared to the *class's* base stats, and if the *character's* base stat is lower, it will get automatically raised to the *class's* base stat. 

The most common example where this comes into play is the Armored Knight class, which has a base DEF of 12, much higher than some characters are likely to have at level 10. By making those characters pass through Armored Knight, you can increase their DEF without using any items, just training (or renown in New Game+).

If you look at the statistical model, this takes all of the probability distribution below `DEF=12` and moves it into `DEF=12`. So in some cases you will see someone's calculated growth profile with a conspicuous second hump at the low end. That's the class base stat boosting the character.

#### RNG Protection

All house-affiliated student characters, and Byleth and Anna, have a hidden feature to protect them from bad levelups. If a character would have gained less than 2 stat points, instead they will gain +1 STR and +1 MAG.

For affected characters, this means the growth rates on the label aren't the true growth rates. In practice, this tends to add about 3%-5% to STR and MAG growth rates and reduces others by about 0.2%-1.0%. How exactly it gets calculated and modeled is described [further down](#handling-rng-protection).

## Statistical Model

This section describes how the probability distribution calculation works.

### Computational Complexity Tricks

For the moment, let's look at the simplest version of the problem. No [RNG protection](#rng-protection), no class changes, and just leveling from 1 to 31.

#### Naive Solution (Count Every Outcome)

That's 30 repetitions of a single levelup. For each levelup, each stat has a percentage [growth rate](#growth-rates) and each gets a single RNG roll. So with 9 stats, there are `2^9` possible outcomes for each levelup. With 30 levelups, that's `(2^9)^30` possible outcomes over 30 levelups. That's approximately how many atoms are in the universe. So we need shortcuts. 

#### Optimization 1: Independent Events

We can take advantage of the fact that stat growths in one stat don't affect other stats, which is true because we are ignoring RNG protection for now (we'll deal with it [later](#handling-rng-protection)). So they're [independent events](https://www.khanacademy.org/math/ap-statistics/probability-ap/stats-conditional-probability/a/check-independence-conditional-probability). Because of this, we can think of one character's levelups as nine unrelated stats leveling up in parallel. For each stat, we would be rolling the RNG 30 times, and we want to know how many times it came up as `+1` or `+0`. That's a classic [binomial distribution](https://en.wikipedia.org/wiki/Binomial_distribution).

Because the stats are independent, we can think of "every possible outcome" as sampling a value from the binomial distribution of each stat. Doing it this way, we've found a way to only have to enumerate every *unique* outcome. For gaining 30 straight levels, we're down from `(2^9)^30 ≈ 10^81` to around `30^9 ≈ 10^13` outcomes. That's still a "training deep learning models" sized computation and not a "dinky web app" sized computation, but at least we know we don't have to wait until the heat death of the universe for answers.

#### Optimization 2: Answer an Easier Problem

The next shortcut is realizing that pretty much all of the questions we're trying to answer are about one stat at a time, such as Ingrid's STR growth, or Lysithea's DEF growth (because both are typically bad). So the exercise of sampling every outcome doesn't tell us much more than looking at individual distributions for individual stats. So we don't need to look at `30^9` outcomes, we just need to look at `30*9` outcomes. As long as we have an efficient way to compute the distribution for a single stat, we can just do it 9 times and we're good. Unfortunately, the computation for a single stat is also non-trivial because of class changes.

Since class changes also change growth rates, that means it's not just a single binomial distribution anymore. We are calculating one binomial distribution for each class the character levels up with, and then we have to combine them. And when we combine distributions, we get exploding complexity.

For example, if the character spends 15 levels as a commoner and 15 levels as a soldier, the formula for gaining exactly 10 points in 30 total levels (written as: `P(+10,30,total)`) looks like:

    P(+10,30,total) = P(+0,15,commoner)*P(+10,15,soldier) + 
                      P(+1,15,commoner)*P(+9,15,soldier) + 
                      ... + 
                      P(+10,15,commoner)*P(+0,15,soldier)

If you write this out for every value of `P(+x,30,total)`, you basically have to compute the cartesian product of two binomial distributions (`15*15=225` terms) before adding them together back into `30` terms. Now if you spend 10 levels in 9 different classes, that's 1 billion calculations. 5 levels in 18 different classes means just below 4 trillion calculations. The worst case for 90 total levels is about 35 trillion, so we're back to "start the program and come back tomorrow" delays. Oops.

Nobody's actually going to level up a character through 90 levels changing classes every other level, but when you make a calculator app, somebody's going to try it, and it's best if your app doesn't choke when they do.

Now let's factor in class base stats for class changes. Let's say were talking about making Lysithea an Armored Knight. During the class change, we have to consider that if her DEF was below 12 before, then it would get bumped up to 12. So we're not just combining binomial distributions now. We have to store intermediate distributions.

So not only are there lots of calculations to do, combining them into the final result is complex. Ideally we'd find a simpler, more generalizable way to do this that doesn't have a worst case complexity in the trillions of calculations.

#### Alterative Approach: Monte Carlo Method

One classic way to deal with this is through a technique called the [Monte Carlo method](https://en.wikipedia.org/wiki/Monte_Carlo_method). The idea is that if there are far too many possible outcomes and you just want an idea of the probability distribution of some aggregate metric, you can get a pretty good idea of it by randomly sampling.

The benefit of the Monte Carlo method is that it's really simple to program. Just simulate all of the levelup mechanics in code, repeat the simulation a few hundred thousand times, and compile the results. In fact, the first prototype of this calculator used Monte Carlo sampling. I only scrapped it because getting enough samples for useful precision took too long.

The problem with the Monte Carlo method is that you'll always get only approximate results. To get within about 1 basis point (additively) of the exact probabilities, you often need to run the simulation for several minutes. So if there's a faster exact solution, we'd want that. And as it turns out, there is.

### The Solution

The core idea comes from [Pascal's triangle](https://en.wikipedia.org/wiki/Pascal%27s_triangle).

Pascal's triangle is a simple way to calculate coefficients of a binomial sequence, which is also used to calculate binomical distributions. For a large number of samples, if you are looking for one specific term, it's usually faster to directly calculate that term. But if you are trying to calculate all of the terms at the same time, Pascal's triangle compares favorably without having to calculate big numbers. So that's what we're doing.

#### Example

Let's say our character's STR stat is 10, and there's a 0.4 chance (40%) it goes up.

If the character levels up zero times, then the probability distribution looks like this:

    1.0
    10

With one levelup, it's a 40/60 split:

    0.40   0.60
    10     11

If the character levels up twice time, then it's a 40/60 split:

    0.16   0.48   0.36
    10     11     12

The key is that this 40/60 split can be calculated like this based on the second row:

           0.40                     0.60
           10                       11
 
           |   \                    |   \
 
    0.40*0.4    0.40*0.6  +  0.60*0.4   0.60*0.6
    (10 + 0)    (10 + 1)     (11 + 0)   (11 + 1)

Which combines into...

    0.16                0.48               0.36
    10                  11                 12

We're taking the second row, multiplying the probability by 0.4 for the left, 0.6 for the right, and flowing the probabilities down into the third row. Then we add the middle bucket because `10+1` and `11+0` are mutually exclusive outcomes that produce the same result.

You can probably see how this generalizes to wider rows further down in the calculation.

#### Complexity Analysis

Done this way, even if we're calculating 100 levelups, that's `2 + 3 + ... + 101` terms, give or take, so we're calculating roughly 5,000 terms, 10,000 if you're counting before combining buckets. Multiply by 9 for the other stats, so around `10^5`. Compared to directly computing binomial distributions or Monte Carlo sampling, this is basically instantaneous!

Now let's factor in class changes.

#### Modeling Class Changes

Class changes introduce two complexities:

1. Bonus stats will cause a character to change stats without gaining any.

1. Base stats might cause a character's stats to increase.

The first issue is simple: when doing the calculations, do them without the class bonus stats, and only add class bonus stats back in when you're showing the results. It's convenient because things like max stats apply to the character's stats without class bonus stats.

The second issue is a bit more nuanced. A visualization will probably help. Here is the probability distribution for Ferdinand's DEF stat if he levels up as a Noble from 1 to 20, and then he either becomes an Armored Knight and then switches back to Noble, or he never touches Armored Knight. Red is the first case. Blue is the second.

![Probability distributions with/without passing through Armored Knight](./class_change.png)

The two probability distributions are identical above 12, which happens to be the base DEF stat for Armored Knight. And in one distribution, the probability of `DEF=12` is the same as the sum of all `DEF≤12` in the other. This makes sense because that's how class changes work: base stats get pulled up to the class's base stat.

We can model this in the "Pascal's Triangle" approach by just taking the row of the triangle and "pushing" all of the probability distribution function below the class's base stat up into the bucket for the minimum value. Then subsequent levelups can just operate on the scrunched up probability distribution function.

### RNG Protection, or Why We Can't Have Nice Things

We've been ignoring RNG protection up until now, but we have to factor it in to get correct results because it moves actual growth rates by single digit percentage points. And as it turns out, RNG protection is a big problem for the analysis because it violates some key assumptions we took earlier.

The problem is that RNG protection makes stat growths no longer independent of each other. If there are less than two +1's total, suddenly the outcome changes because some +1's might flip to +0 and some +0's might flip to +1. So that assumption we made earlier about stats being independent of each other is technically wrong for most characters.

If the nine stats were fully independent, we could calculate the probability that a student character gained exactly +1 to DEX and nothing else by multiplying those "after the fact" probabilities to calculate the probability of a "+1 DEX only" outcome at `0.5^9`. However, since we know that stat gains of less than 2 total aren't possible for this character, we know the answer should be `0`. That's only a difference of about 0.1%, but when you compound it over many levelups you would expect the error to grow.

So we have a problem: depending on what we are trying to calculate, we can't necessarily model all of the stats independently, because they're not truly independent for student characters.

#### Accounting for RNG Protection for Single Stats

As long as we're talking about a single stat in isolation, even with the RNG protection mechanism we can still calculate the exact probability that it will go up in a levelup, which is great because that means our "Pascal's Triangle" algorithm can still work. It just can't use the raw growth rates.

The RNG protection feature works like this:

* We first roll all of the stat gains.

* If two or more stats will go up, we just run with it. 

* If zero or one total stats will go up, then instead of whatever happens, STR and MAG go up and the rest don't.

It's a bit hard to model the priors for this, so we can break it down into four scenarios instead, based on whether the "stat of interest" goes up:

1. The stat of interest does not go up and 0 other stats go up.

1. The stat of interest does not go up and 1 other stat goes up.

1. The stat of interest does not go up and 2 or more other stats go up.

1. The stat of interest goes up and 0 other stats go up.

1. The stat of interest goes up and at least 1 other stat goes up.

We know cases #1, #2, and #4 are where RNG protection kicks in, and #3 and #5 are standard outcomes. If we're trying
to calculate the probability that the stat of interest goes up, then it falls into one of two cases:

* The stat of interest is STR or MAG, so we need to know the probabilities of cases #1, #2, #4, and #5.

* The stat of interest is not STR or MAG, so we need to know the probability of case #5.

To address the simplest case first: if you're not looking at STR or MAG...

    P(case #5) = P(stat up) - P(case #4) 
               = P(stat up) - P(stat up) * P(all other stats don't go up)
               = P(stat up) * (1 - P(all other stats don't go up))

    P(all other stats don't go up) = PRODUCT(1 - P(stat N goes up)) over all N that isn't the stat of interest

Easy enough.

Next, if it's STR or MAG, we want to calculate the probabilities of cases 1, 2, and 4. Conveniently, we can add case #2 to case #4 to define the case where exactly one stat goes up. So...

    P(case #1) + P(case #2) + P(case #4) = P(zero stats go up) + P(exactly one stat goes up)

    P(zero stats go up) = PRODUCT(1 - P(stat N goes up)) for every stat N
    P(exactly one stat goes up) = SUM(P(only stat T goes up)) for every stat T
    P(only stat T goes up) = P(stat T goes up) * PRODUCT(1 - P(stat N goes up)) for every stat N that isn't T

Since there are nine different stats, all of these `PRODUCT` and `SUM` terms would be a bit lengthy to write out,
but they give us an analytical solution to finding the "adjusted growth rates". You can find this implemented in the code
for [getAdjustedGrowthRates()](https://github.com/knsley/fe3hanalyzer/blob/main/mc3h/src/sim/AdjustedGrowthRate.ts).

If you're curious what the "true" growth rates look like for each individual stat, this app writes them out to the debug console in the browser's developer tools. If you're using Chrome/Edge, you can get there with `CTRL+SHIFT+I`. For Firefox, `CTRL+SHIFT+J`. Keep in mind that these are the growth rates for stats considered in isolation. They don't tell you the full story because for student characters stat gains are not independent events.

#### How Much Error Does RNG Protection Add?

That depends on whether you are measuring individual stats in isolation or aggregates of the stats. 

As we showed above, you can still accurately analyze a single stat for a student character because you're ignoring all of the other stats. You just need to factor in how RNG protection affects a single stat's growth rates. You can experimentally verify this by using the adjustment formula described in the previous section and comparing the results to a Monte Carlo sampling of full simulations, and looking at the empirical distributions for those single stats. In fact, since "correctness" is an acceptance criterion, one of the unit tests compares the app's predictions against a Monte Carlo sampling. 

In addition to single stat probability distributions, we can also accurately calculate the "Total Stat Gains" chart because the math is simple: if it's a student character, every levelup with 0 or 1 gains gets pushed up to 2.

The problem happens when you want to look at all of the stats together. As we've shown, if RNG protection is in play, we can't reconstruct the probabilities of all of the specific outcomes (final stat lines) from just probability distributions for individual stats.

Fortunately, the only place where that matters is the overall ["how lucky is this character?" metric](#rngesus-luck-analysis-formula). We'll talk about the error analysis [later in that section](#error-from-rng-protection).

### Handling Max Stats

Each character has max base stats. When a character hits those, their stat stops growing regardless of RNG. These caps can be raised a little bit through remodeling bonuses for the Saints' statues, but the cap is still there.

The algorithm handles this pretty gracefully: when it's calculating the probability of having the max stat, it adds up the three cases:

* The previous stat was one below max and the stat went up by one on the levelup
* The previous stat was at the max and the stat did not go up
* The previous stat was at the max and the stat should have gone up

In practice, it's doing the same thing conceptually as when a stat gets raised during a class change: it just clamps the upper end of the distribution and pushes it all into the probability bucket for the stat at its max.

### Testing with Monte Carlo Sampling

So how do we know this "Pascal's Triangle" approach actually works, and that we wrote the code correctly?

We can't really know that the code is entirely free of bugs - I'd bet lots of money that it isn't. But we can do some sanity checks that the code generates credible answers. The idea is to use a slower but simpler algorithm (the Monte Carlo method) to test the faster but more complex algorithm. We can't use the slower algorithm in the actual app because it'd drive everyone mad if the calculation takes entire minutes every time you changed a single variable. But if I'm just running it to test my code, I can easily go get some coffee and come back to check the results. And if we can get the same numbers two different ways, it's more likely we really do have the right answers. 

The code is calculating probabilities of characters ending up with specific stat values, so in theory if we were to take all of the instances that ever happened to every player of, for example, Byleth as a soldier leveling up from 5 to 10, we would expect the outcomes to happen in similar proportions. 

We can do something like that. Since we know the levelup rules, we can just simulate a few million example runs of the exact same levelup and class change schedule, and we can record how many samples ended up with each outcome. With enough samples, the empirical probability distributions should look almost identical to the analytically calculated probability distributions.

Turns out that's more or less the case within 0.01%. Once of the unit test suites in the code explicitly runs the analytical results against Monte Carlo sampling.

### Mean vs. Median

Most people calculate the mean (the expected value) because it's easy to calculate: take the growth rate, multiply by number of levels, and you have a number to represent the character. This has a subtle problem.

The mean (expected value) is generally useful when you want to think about the aggregate results of repeated trials. So if you wanted to know "how many stat points do I expect to gain over 30 levels?" then you want the mean. But in this game you aren't going to roll one hundred different Claudes, you're going to roll one at a time.

The median, or percentile rank in general, is useful when you want to think about how your single result stacks up against the rest of the population, i.e. RNG luck. So if you want to know "of all of the possible outcomes after gaining 30 levels, how does my character stack up?" you want percentile ranks. 

This app uses the median instead of the mean for "averages" for this reason: most of the questions the app tries to answer have to do with how single trials stack up against a big population. 

## Overall RNG Luck Formula

When it comes to RNG, there are two sorts of questions you'd generally want to ask:

* Did my character get screwed on a specific stat? (For example: did Ingrid get screwed by RNG on STR growth again?)

* Did my character get a lot of bad levelups, or are they just a bit more lopsided than usual?

When it comes to specific statistics, we have an easy answer from the probability distributions for single stats, and we can show it in a radial chart, which is a common way to visualize a single data point's position on multiple axes (the nine stats).

But let's say you're wondering whether the character is salvageable: did they get a surplus of bad luck that would require lots of stat boosting or RNG manipulation to reverse, or are they actually getting plenty of stat gains, just not in the usual places? You can't answer that from the information about single stats, so I made an overall metric to give you a sense for it.

### Designing the Formula

The core idea behind this aggregate rating is this: say your character is a bit stronger than usual, but also a bit squishier than usual. That doesn't mean the character is unlucky. After all, they're hitting harder. It just means you need to play them a bit differently. When this happens, their overall luck rating should still be approximately average.

What if the character has a mostly average stat line but a couple stats are a point or two higher? Then your character is objectively luckier than expected.

So luck in different stats can cancel each other out, but good/bad luck across multiple stats should accumulate. That points towards something like an arithmetic/geometric mean. In general, the geometric mean tends to react less to outliers. Since outlier stats in Fire Emblem tend to make characters completely dominant or permanent benchwarmers, I used the arithmetic mean instead.

But there's a problem: you can't just average the stats because every setup produces different averages. And you can't really normalize them either, because the theoretical spread after 30 levelups is a 31 point difference where only the central ~16 outcomes have more than a 1/1000 chance of happening. So, instead of using the stats explicitly, I use the percentile rankings. We know that number will be between 0 and 1, and the shape of the probability distribution for any single stat is baked into the percentile number.

That said, in Fire Emblem Three Houses we care more about extreme outlier stats, and we care about some stats more than others. So rather than a straight average, we fudge the computation a bit to give more weight to two things:

* Percentile rankings at the two extremes

* Stats that matter more (Strength and Magic over Luck and Charisma)

The final general principle we'd expect is that if we generated a million random outcomes for a specific character build, we'd qualitatively expect RNG luck to fall on a bell curve. So our metric should reflect that.

The end result that we came up with was, rather than a straight average, to:

1. compute the weighted (according to how valuable the stat is) arithmetic mean of the percentiles (normalized for -1 to 1 instead of 0 to 1), apply an exponent to it while preserving the sign to emphasize outliers, and then

1. apply the hyperbolic tangent to the arithmetic mean to clamp the final result back into the -1 to 1 range.

Those of you who do machine learning stuff might recognize the hyperbolic tangent as an activation function - that was the inspiration.

The end result is a metric that gives you a decent idea of overall RNG luck, although it unfortunately loses the trees for the forest. If you want nuance, the radial chart gives you a better visualization.

### Quantization of Percentiles

So far we've been talking as if percentiles were somewhat evenly distributed and the chance of two data points having the same percentile rank was low. In practice, because stats are discrete integer values on a bell curve distribution, it's extremely likely that out of 1 million samples 200,000 of them are all the median at the same time. So how do you represent their percentile rank? If they represent the 45th to 65th percentiles, there's a problem in the direction of the conversion. If you want to know the 50th percentile (median), you can get the median value, but if you want to know what percentile rank the your character who happens to have the median value is, it's anywhere from 45% to 65%.

As a compromise, we represent the answer as the midpoint of the range of percentiles. So in the example above, your character would be 55th percentile. Your character would also be the median, but the 55th percentile rank better represents that the median value actually biases a little on the high side.

### Error from RNG Protection

It's really tough to answer the question directly, but let's take a naive pass at it: if we assume a student character does not have any RNG protection, how often would we still be correct? Let's assume a character with 40% growths across the board. That's unrealistic because almost no characters are this well rounded, but most characters will fall on both sides of the 40% line depending on the stat, making 40% a slightly pessimistic approximation, which means the error we calculate will be on the higher side.

    P(RNG protection activated)
    = P(0 stat gains) + P(1 stat gain)
    = 0.6^9 + 9 * 0.4*0.6^8
    ~= 0.0705

So for each levelup there's a ~93% chance that simulating a student character as a non-student will be accurate, and ~7% of the time there will be some error. Accumulate this over 30 levels and there's only a ~11% chance that error didn't creep into the computation at all. That's pretty bad. Might as well just admit we won't have an exact answer. But, thankfully, that's not quite the question we're asking.

The question we're actually asking is this: if 

1. for a character with RNG protection, we...
1. use the single-stat probability distributions that take RNG protection into account, and then...
1. we incorrectly assume we actually can reconstruct specific probabilities from the single-stat distributions

then how far off would the result be from if we actually tried to calculate the exactly correct answer?

If we're talking about characters gaining 30+ levels, I don't know of any way to calculate an analytical answer to this question before the heat death of the universe. But we can get an approximation from our old friend [Monte Carlo](https://en.wikipedia.org/wiki/Monte_Carlo_method). We can set up a hypothetical character profile, generate a large number of samples, and look at where these samples fall on the RNG luck metric. Since the theoretical median of all possible outcomes should be exactly 0, we'd want the median of the samples to be pretty close to 0. More specifically, for non-student characters where the assumptions above are actually correct, we'd expect the Monte Carlo sampling to produce a median damn close to 0. For student characters, we're hoping that the median is close enough to 0.

That turns out to be true enough. For the non-student characters, let's use this profile for Shamir:

* Recruit in Chapter 6 (level 11 Sniper)
* Switch to Bow Knight at level 30
* End at level 41 (30 levelups)

Running the Monte Carlo simulation for 1 million samples, we get a median RNG luck metric of about `0.00045`. That's plenty good since single point stat differences tend to move the metric by 100x as much.

Now for a student character, let's try a common Ingrid build:

* Recruit in Chapter 3 (level 5 soldier)
* Switch to Pegasus Knight at level 10
* Switch to Wyvern Rider at level 20
* Switch to Falcon Knight at level 30
* End at level 45

This time our median is about `-0.00063`. The RNG protection metric's effect seems to be still miniscule compared to the effect of a single point stat difference.

You can try this with a few other data points, but the gist of it is that our RNG luck metric seems to absorb the accumulated error from the RNG protection mechanism pretty well. It seems that while we're virtually guaranteed to be wrong about modeling individual outcomes, once we start chucking averages everywhere the error gets drowned out.

## Appendix

All of the stuff that didn't fit into another category.

### Catherine's Presets

Catherine's Chapter 9 recruitment stats look incorrect in the [source material](https://fireemblemwiki.org/wiki/Catherine/Stats) with a `SPD=22` at level 17 because it's a decrease from her `SPD=23` speed at level 15 in Chapter 8. Using the [formula for monastery autoleveling](https://www.reddit.com/r/fireemblem/comments/d0w2hr/an_analysis_on_the_monastery_autolevelling/), `SPD=23` at level 15 is consistent, and so is `SPD=28` at level 21. Using the same formula, Catherine should have `SPD=25` at level 17. 

Until I've been able to play through to Chapter 9 to check Catherine's stats, this app will use the projected speed stat of 25.

### Levelups Near Stat Caps

All characters have maximum base stats (stats once class bonus stats are removed). Actually hitting those stats is rare, but if you're power-leveling you will eventually hit them.

When a character has maxed out a stat, it increases the chance that they will gain less than two stats in a levelup. How this interacts with RNG protection for student characters isn't well documented (if STR or MAG is maxed, does another stat go up?), and I haven't had the time to experiment with it myself.

### Why Not Support Stat Boosters?

Mostly I just haven't gotten around to writing the code. But the reason it's so low on the list is that, despite being one of the more complicated UI things to build, stat boosters aren't that interesting from a strategy perspective:

* They just shift the whole curve to the right by 1-2 points.
* If you plan to take advantage of base stats in a class change, like Armored Knight, then using the DEF booster after the class change is always better or equivalent.

In other words, if you were keeping close enough tabs on your characters to remember how many of each stat booster they got, you can also just subtract those stats for RNG analysis.

### Cyril

Cyril has the "Aptitude" ability which increases his growth rates by 20% across the board. This calculator just bundles it all into his base growths.

### Stat Boosts and Mounts

Many characters have access to a "+5" bonus to a specific stat. Some classes also have stat boosts tied to being mounted. This app assumes that none of those bonuses are active and that the character is mounted.

If your character has one of those boosts active, just subtract it from your character's stats for this calculator. If your character is dismounted, have them mount and use the mounted stats.

If you are in the monestary, just go into their abilities lists and remove all stat bonus abilities.

### Level Minimums

#### House Leaders

Since house leaders get access to their unique classes based on story progression, the app just allows them access to those classes at any level.

In practice, it's unclear whether the game auto-levels house leaders as their unique class during the timeskip, or whether it auto-levels them and then changes their class. That's left for you to figure out.

#### Catherine and Shamir

Catherine and Shamir have access to advanced classes at lower levels than usual. The app makes an exception to give them access to the Swordmaster and Sniper classes based on the lowest level when they can be recruited.

### Gendered Classes

Some classes are only accessible to some genders. You can find a list [here](https://serenesforest.net/three-houses/classes/). I made the decision to have the app enforce these constraints because the base game does, though some players mod their games to play with these constraints removed.

### Handling of Byleth's Gender

In order to avoid expressing a preference for the protagonist's default gender, Byleth's gender is a 50/50 random pick when used as the default profile.
