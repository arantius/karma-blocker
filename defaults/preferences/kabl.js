pref('extensions.kabl.enabled', true);
pref('extensions.kabl.debug', 0);
pref("extensions.kabl.rules", "# This is a ruleset configuration for Karma Blocker.  For more information, see:\n#   http://trac.arantius.com/wiki/Extensions/KarmaBlocker\n\n# This default ruleset is intended to be demonstrative: making productive\n# use of all the features that the Karma Blocker rule syntax provides.  It\n# should generally work, but it has intentionally not been tweaked to deal\n# with the particulars of any given site.  All rules here are intended to\n# explain what can be done, and how it can be done, while remaining as\n# generic as possible, with limited exceptions.  You the user are expected\n# to tweak and customize these rules.\n[Settings]\nthreshold=12\ncutoff=12\ncollapse=false\n\n[Inject]\nfunction='DM_tag'\nfunction='OA_show'\nfunction='_gat._getTracker'\nfunction='quantserve'\nfunction='s.t'\nfunction='setOmniturePageName'\nfunction='urchinTracker'\n\n# If any request that a Flash movie makes is blocked, the entire Flash\n# movie will remove itself from the page.  So if we let the movie\n# through, we let all requests it makes go through, with this rule.\n[Group]\nname=\"Whitelist: flash sub-request\"\nscore=-13\nrule=$type==object_subrequest\n\n# eBay uses third-party iframes for auction descriptions now, to\n# prevent the XSS hole they left open for a long time.\n[Group]\nname=\"Whitelist: eBay\"\nmatch=any\nscore=-13\nrule=$url.host=='cgi.ebay.com'\nrule=$url.host=='vi.ebaydesc.com'\nrule=$url.host=='srx.main.ebayrtm.com'\n\n[Group]\nname=\"Whitelist: HTTPS\"\nscore=-4\nrule=$url.scheme=='https'\n\n[Group]\nname=\"Whitelist: CDNs\"\nscore=-4\nmatch=any\nrule=$url.host$='.akamai.com'\nrule=$url.host$='.asset-cache.com'\nrule=$url.host$='.cachefly.com'\nrule=$url.host$='.fsdn.com'\nrule=$url.host$='.ggpht.com'\nrule=$url.host$='.gstatic.com'\nrule=$url.host=~'cdn'\n\n[Group]\nname=\"Whitelist: Keywords\"\nscore=-4\nmatch=any\nrule=$url=~'(\\b|_)(downlo|uplo)ads?\\d*(\\b|_)'\n\n[Group]\nname=\"(I)FRAMEs and Scripts\"\nscore=6\nmatch=any\nrule=$type==script\nrule=$type==subdocument\n\n[Group]\nname=\"Feed Trackers\"\nscore=4\nmatch=any\nrule=$url.path=~'^/~.{1,2}/'\nrule=$url^='http://feeds.wordpress.com/1.0/'\n\n[Group]\nname=\"Size: 0x0 & 1x1\"\nscore=4\nmatch=any\nrule=$origin.tag.size=='0x0'\nrule=$origin.tag.size=='1x1'\n\n# See: http://www.iab.net/iab_products_and_industry_services/1421/1443/1452\n[Group]\nname=\"Size: Standard Banner\"\nscore=4\nmatch=any\nrule=$origin.tag.size=='300x250'\nrule=$origin.tag.size=='468x60'\nrule=$origin.tag.size=='234x60'\nrule=$origin.tag.size=='88x31'\nrule=$origin.tag.size=='120x90'\nrule=$origin.tag.size=='120x60'\nrule=$origin.tag.size=='120x240'\nrule=$origin.tag.size=='125x125'\nrule=$origin.tag.size=='728x90'\nrule=$origin.tag.size=='160x600'\nrule=$origin.tag.size=='120x600'\nrule=$origin.tag.size=='300x600'\n\n[Group]\nname=\"Third-party\"\nscore=4\nrule=$thirdParty==true\n\n[Group]\nname=\"Unsavory hosts\"\nscore=4\nmatch=any\nrule=$url.host$='.addtoany.com'\nrule=$url.host$='.blogads.com'\nrule=$url.host$='.imrworldwide.com'\nrule=$url.host$='.kontera.com'\nrule=$url.host$='.scorecardresearch.com'\nrule=$url.host$='.statcounter.com'\n\n[Group]\nname=\"Images\"\nscore=3\nrule=$type==image\n\n[Group]\nname=\"Extra-long URLs\"\nscore=2\nrule=$url.path=~'.{175}'\n\n[Group]\nname=\"Keywords (Full)\"\nscore=2\nrule=$url=~'(\\b|_)ad(frame|sense|server?|sonar)?s?\\d*(\\b|_)'\nrule=$url=~'(\\b|_)banners?\\d*(\\b|_)'\nrule=$url=~'(\\b|_)(analytic|quant|s_code|track|urchin|webtrend)(s|er|ing)?\\d*(\\b|_)'\nrule=$url.host=~'metrics'\n\n[Group]\nname=\"Keywords (Partial)\"\nscore=2\nrule=$url=~'(\\b|_)ads?\\d*|ads?\\d*(\\b|_)'\nrule=$url=~'(\\b|_)track(s|er|ing)?\\d*|track(s|er|ing)?\\d*(\\b|_)'\n\n[Group]\nname=\"Long Querystring\"\nscore=2\nmatch=all\nrule=$url.path=~'\\?(.*&){6,}'\n\n[Group]\nname=\"Objects (Flash)\"\nscore=2\nrule=$type==object\n\n[Group]\nname=\"Querystring\"\nscore=1\nrule=$url.path=~'\\?'");
pref('extensions.kabl.sync_enabled', false);
pref('extensions.kabl.sync_check_interval', 3600000);  // ms = 1 hour
pref('extensions.kabl.sync_last_rules', '');
pref('extensions.kabl.sync_last_time', '0');
pref('extensions.kabl.sync_update_interval', 432000000);  // ms = 5 days
pref('extensions.kabl.sync_url', 'https://gist.github.com/raw/857951/Karma_Blocker_Default_Rules.ini');
