# Documentation

Karma Blocker is an ad/nuisance blocker and privacy enhancer for technical people.
It uses a simplistic definition language to assign "karma" points to every resource that Firefox loads when rendering pages.  If any resource gathers enough points, it is blocked.  It sports the following features:

 * Request-time blocking of any resource.
  (Blocked objects never load, never use bandwidth, never set cookies.)
 * Karma (or score) based weighting of objects, similar to popular spam filtering solutions like [SpamAssasin](http://spamassassin.apache.org/).
 * A flexible expression language for powerful filtering, on a richer set of data than simply "the URL".
 * Global function injection; if a script is blocked, yet functions in it are still called, injecting a blank function of the same name will eliminate any errors.

## Operation

Every time Firefox begins to load any resource (page, image, style sheet, javascript file, etc.) Karma Blocker will first check it against the rules it is configured to use.
If the rules match that request, it will be denied and never load.
There are certain exceptions:

 * When Karma Blocker is disabled (and the status bar icon is greyed out), all requests will be allowed.
 * When the resource is not from one of the schemes `http`, `https`, `ftp`, `chrome`, all requests will be allowed.
 * Three different checks are made to ensure that resources that form part of the browser itself (i.e. the back/forward buttons, icons, etc.) are never blocked.

Click the icon in the status bar to globally enable/disable Karma Blocker.

## Configuration

See [Configuration wiki page](https://github.com/arantius/karma-blocker/wiki/Configuration).

# Changelog

 * Version 0.4.8 (October 17, 2013)
   * Performance Enhancements
 * Version 0.4.7 (September 1, 2013)
   * Small bug fixes for compatibility with modern Firefox versions.
 * Version 0.4.6 (August 16, 2011)
   * Do not warn when local and to-sync rules match. (#529)
   * Fix warning about internal Firefox API change. (#530)
   * Support up to Firefox 7. (#532)
 * Version 0.4.5 (June 27, 2011)
   * Fix changing the rules w/out requiring a browser restart. (#499)
   * Tweaks to default rule set. (#513, #518)
   * Display a spinner in the config dialog's sync button while loading the remote resource.
   * Compatibility with Firefox 5.0.
 * Version 0.4.4 (March 15, 2011)
   * Detect invalid regular expressions. (#487)
   * Fix early DOM access bug (forced visibility of tab scroll buttons). (#488)
   * New icons.
 * Version 0.4.3 (March 7, 2011)
   * Firefox 4 compatibility. (#482)
   * Properly handle resources loaded from pretty-printed feeds. (#372)
   * Check for undefined property accesses. (#412)
   * Fix syntax in default rules. (#415)
   * Indicate in the monitor dialog when the cutoff score halts processing. (#416)
   * When a rule was not checked, display 'Skipped' for match rather than 'No'. (#417)
   * Do not reset the 'Scores' box of the monitor window when resources are added. (#419)
   * Add less than and greater than operators. (#421)
 * Version 0.4.2 (Jan 11, 2009)
   * Fix typo in default preferences, causing the rules to be just "undefined". (#392)
   * New button in configuration dialog, to reset to default rules. (#389)
 * Version 0.4.1 (Dec 31, 2009)
   * Firefox 3.6 compatibility flag.
   * Avoid spurious "function anonymous() { }" text in page. (#306)
   * Add an optional toolbar button. (#285)
   * Monitor dialog displays types correctly. (#370)
   * Add `origin.size` property, for compact size rules. (#371)
   * New default rules to demonstrate new features, cause less false positives. (#265)
 * Version 0.4 (Jun 26, 2009)
   * Mark Firefox compatibility with 3.0 through 3.5.
   * Add option for the monitor window to gather only blocked resources. (#221)
   * Add configuration setting to enable/disable the element collapsing feature (now ''off'' by default), and make it less aggressive when it is enabled. (#209)
   * Allow functions with properties to be injected, i.e. `inject='_gat._getTracker'` will eat undefined function errors from blocked Google Analytics scripts. (#253)
   * Disable wrapping when editing rules, so long lines display on one line (with a horizontal scroll bar).
   * Never block core parts of the browser itself. (#222)
   * In the monitor window, you can copy data, remove items, open URLs, and expand/collapse rows via a context menu. (#266)
   * New default rules which are highly functional. (#265)
 * Version 0.3.2 (Sep 27, 2008)
   * Bug fix, certain rule sets can cause Firefox to freeze. (#182)
 * Version 0.3.1 (Jul 15, 2008)
   * Enhanced element collapsing.  (When an ad is blocked, if it is inside an otherwise empty, fixed size container, that container will be removed from the page.)
 * Version 0.3 (Feb 9, 2008)
   * Bug fix: allow rules to block chrome (#93).
   * Compatibility with Firefox 3.0.
   * Feature: Monitor window, which displays the score, and blocked status of all resources, plus the match status and score contribution of each group, for each resource.
   * Add the "name" field for "Group" sections, to allow meaningful group display in the monitor window.
 * Version 0.2.1 (Jun 28, 2007)
   * Add debugging output detailing where functions are being injected to.
   * Fix home page address.
   * Remove stability/security disclaimer, a few months of testing have gone well.
 * Version 0.2 (Feb 17, 2007)
   * Initial release of Karma Blocker with full feature set:
     * Karma based scoring system.
     * Flexible rules language for matching.
     * Function injection.
 * Version 0.1 (Jan 3, 2007)
   * Initial release of grandfather project, Third Party Script Stopper.

# Credits

 * [Using the RegExp Object for Lexical Analysis in Javascript](http://cc.usu.edu/~amcinnes/js-regexp-lexing.html) - Lexical analysis algorithm
 * [FireBug](http://www.getfirebug.com/) - Content page function injection
 * [Fast Icon](http://www.fasticon.com/) iSimple System set - Main Icon
 * [famfamfam.com](http://www.famfamfam.com/lab/icons/silk/) Silk icons set - Blocked Icon
 * Previously: [Everaldo Coelho](http://everaldo.com/) Crystal Clear Actions icons set - Main Icon
 * [AdBlock](http://adblock.mozdev.org/) and [AdBlock Plus](http://adblockplus.org/) - Ideas, some code sections

# License

Karma Blocker is released under the GPLv2 license.
