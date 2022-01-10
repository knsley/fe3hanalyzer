# Frequently Asked Questions

## Q: How do I use this?

You can use this to compare theoretical character builds or to analyze how your character stacks up.

The "Individual Stat Breakdown" report lets you compare the probability charts of different builds. For example, what is the difference between recruiting someone in Chapter 2 vs. Chapter 3 for the exact same build? Which mage has the highest MAG growth?

The "RNGesus Luck Analysis" report tells you how your character stacks up against its alternate universe clones. Just fill out the build, generate the report, and then fill in "Your Character's Stats" to see how your character's luck played out.

## Q: What if I don't remember the character's starting stats?

For your convenience, all of the common starting stats (when you recruit the character) are available as presets. Just click the "Look Up Stats" button and scroll through the available options.

For example, if you recruited Lysithea in Chapter 5, just click the "Look Up Stats" button, select "Lysithea" and "Recruit at Chapter 5", and hit "Load Stats".

## Q: How do I account for battalions, abilities, item bonuses, etc.?

First, note that this app *does* account for the character's current class.

This calculator unfortunately doesn't account for other sources of temporary stat changes, so before entering numbers you may want to reset your character to a baseline by:

* Unequipping any stat boosting items
* Unequipping any stat boosting abilities
* Unequipping battalions
* Making sure other miscellaneous stat effects like Rally abilities aren't active

It helps to do all of this from the monestary or pre-mission screen, rather than doing it mid-mission, but if you are trying to figure this out mid-mission, you can also subtract the effects yourself.

## Q: How do I account for stat booster items?

Unfortunately this tool doesn't account for applying them in the middle of leveling up. I didn't include stat boosters because they are generally not interesting for comparing builds, and because if you actually remember which stat boosters are on your current character for RNG  luck analysis you can just subtract them.

I might add this in the future since it can have non-trivial interactions with stat manipulation techniques, such as DEF boosting before/after classing through Armored Knight.

## Q: How do I share my builds with other people?

Under each character portrait, there's a pair of "Import" and "Export" buttons. You can use them to export text codes (JSON) that someone else can then import.

## Q: Why is this so complex? What's wrong with calculating simple averages?

Averages are useful, but they don't tell you the whole story. There are two main problems:

1. A common stat optimization technique is to qualify a squishy character for Armor Knight to boost defense. It works, but the way it works is weird, and you can't see exactly what it does if you are only calculating averages.

1. Averages are for summarizing information about the aggregate of many data points. They don't tell you about your specific data point relative to the population. To know how lucky you are, you need to see a more detailed description of the population.

## Q: Why are some characters' growths per level never less than 2?

The game has a hidden "RNG protection" feature where if certain characters get less than two +1's during a levelup, the game will give them a guaranteed +1 STR and +1 MAG. This can change a character's actual growths by anywhere from a tenth of a percentage point to about 5% compared to the reference growth rates. 

In order to be accurate, this calculator takes the RNG protection into account. The documentation describes how this works in more detail. 

## Q: What does the RNGesus luck rating mean?

An overall rating for RNG luck is hard to do because characters are almost always a little lucky in some stats, a little unlucky in others, and an outlier in one or two stats.

So this app answers all of the questions at once: 

* Overall, how (un)lucky is the character? The RNG rating tries to give an overall assessment in a single number: -1 is worst, 1 is best, 0 is "average". For a detailed discussion see the documentation.

* For each stat, was the character lucky? Unlucky? The radar chart tells you for each individual stat. For example, is Ingrid's STR growth just the normal low levels, or is it objectively low for Ingrid?

## Q: How accurate is this app?

The app outputs fully analytical results. The statistical model was tested using Monte Carlo sampling and verified to converge within 0.01% of the randomly sampled results.

There are two sources of inaccuracy:

* Floating point/rounding errors, which are checked for with Monte Carlo sampling

* Incorrect modeling of levelups when multiple stats are maxed out

Since characters almost never max out on multiple stats in practice unless you did some serious power leveling, this shouldn't become an issue unless you're analyzing some truly wonky builds.

## Q: Why would you spend your time on this?

I built this to answer a hard question: did my character get screwed by the RNG?

We've all had that sensation: some character's strength stat is way lower than it should be. Is it just me? How would I even begin to analyze this?

Turns out nobody really had a rigorous answer, and calculating the answer was actually really complex. So I went down the rabbit hole and came back out with this app.

Unfortunately, working on this took up all the time I could've spent playing the game, so I haven't actually finished the playthrough that inspired this project.